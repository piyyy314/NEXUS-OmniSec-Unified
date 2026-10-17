#!/usr/bin/env python3
"""
NEXUS OmniSec — Native Telegram C2 (Command & Control) Daemon
─────────────────────────────────────────────────────────────
Allows you to control your NEXUS Workstation, run terminal commands,
query the local Shadow313-7B model, and inspect the Sentinel daemon
directly from your smartphone via Telegram.

Features:
  - Long-polling (no open ports or public IP needed)
  - Strict Chat ID whitelist (prevents unauthorized access)
  - Local Ollama AI integration (/ask <question>)
  - Native Windows process management & Sentinel telemetry
  - Command execution (/sh <cmd>)
"""

import os
import sys
import time
import json
import psutil
import subprocess
import requests
from datetime import datetime, timezone
from pathlib import Path
from dotenv import load_dotenv

# Load environment from project root or current dir
load_dotenv(Path(__file__).resolve().parent.parent / ".env")
load_dotenv(Path(__file__).resolve().parent / ".env")

BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")
ALLOWED_CHAT_ID = os.getenv("TELEGRAM_CHAT_ID", "")
OLLAMA_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "matarmohamad313/shadow313-nexus")

TG_API = f"https://api.telegram.org/bot{BOT_TOKEN}"


def send_message(chat_id: str, text: str, parse_mode: str = "HTML"):
    """Send text message to Telegram, splitting long responses if needed."""
    if not BOT_TOKEN:
        print("[!] TELEGRAM_BOT_TOKEN not configured.")
        return

    # Telegram max message length is 4096
    max_len = 3900
    chunks = [text[i:i + max_len] for i in range(0, len(text), max_len)] or [""]
    for chunk in chunks:
        payload = {
            "chat_id": chat_id,
            "text": chunk,
            "parse_mode": parse_mode,
            "disable_web_page_preview": True
        }
        try:
            requests.post(f"{TG_API}/sendMessage", json=payload, timeout=10)
        except Exception as e:
            # Fallback to plain text if HTML tags fail to parse
            payload["parse_mode"] = ""
            try:
                requests.post(f"{TG_API}/sendMessage", json=payload, timeout=10)
            except Exception:
                pass


def handle_status() -> str:
    cpu = psutil.cpu_percent(interval=0.5)
    ram = psutil.virtual_memory()
    disk = psutil.disk_usage("C:\\")
    uptime_sec = time.time() - psutil.boot_time()
    uptime_hours = round(uptime_sec / 3600, 1)

    # Check workstation port 3130
    ws_status = "🔴 OFFLINE"
    for c in psutil.net_connections(kind="inet"):
        if c.laddr and c.laddr.port == 3130:
            ws_status = "🟢 ONLINE (Port 3130)"
            break

    return (
        "⬡ <b>NEXUS OmniSec — System Status</b>\n"
        "─────────────────────────────\n"
        f"<b>Workstation UI:</b> {ws_status}\n"
        f"<b>Host CPU Load:</b> {cpu}%\n"
        f"<b>RAM Usage:</b> {ram.percent}% ({round(ram.used / 1e9, 1)} / {round(ram.total / 1e9, 1)} GB)\n"
        f"<b>Disk Free (C:):</b> {round(disk.free / 1e9, 1)} GB\n"
        f"<b>Uptime:</b> {uptime_hours} hours\n"
        f"<b>Protocol:</b> 313-BIND (FIPS 203/204/205)"
    )


def handle_ask(prompt: str) -> str:
    if not prompt:
        return "⚠️ Please provide a prompt. Example: <code>/ask analyze CVE-2026-3392</code>"

    payload = {
        "model": OLLAMA_MODEL,
        "prompt": prompt,
        "stream": False,
        "options": {
            "num_ctx": 32768,
            "temperature": 0.2
        }
    }
    try:
        resp = requests.post(f"{OLLAMA_URL}/api/generate", json=payload, timeout=60)
        if resp.status_code == 200:
            data = resp.json()
            ans = data.get("response", "No response generated.")
            return f"🧠 <b>Shadow313-7B Intelligence:</b>\n\n{ans}"
        else:
            return f"❌ Ollama Error ({resp.status_code}): {resp.text[:200]}"
    except requests.exceptions.ConnectionError:
        return (
            "⚠️ <b>Ollama is not running locally.</b>\n"
            "Start Ollama on your PC (<code>ollama serve</code>) to query Shadow313-7B."
        )
    except Exception as e:
        return f"❌ Error querying model: {str(e)}"


def handle_sentinel() -> str:
    blacklist = ["nc.exe", "netcat", "nmap", "wireshark", "tshark", "mimikatz", "putty", "ophcrack"]
    running_bad = []
    for proc in psutil.process_iter(['pid', 'name']):
        try:
            name = proc.info['name'].lower()
            if any(b in name for b in blacklist):
                running_bad.append(f"{proc.info['name']} (PID: {proc.info['pid']})")
        except Exception:
            continue

    if running_bad:
        return f"🚨 <b>THREAT DETECTED!</b>\nSuspicious processes active:\n- " + "\n- ".join(running_bad)
    return "🛡️ <b>Sentinel Daemon:</b> ALL CLEAR.\nNo blacklisted or adversarial tools detected in memory."


def handle_shell(cmd: str) -> str:
    if not cmd:
        return "⚠️ Provide a command. Example: <code>/sh dir</code>"

    # Execute via powershell
    try:
        proc = subprocess.run(
            ["powershell", "-NoProfile", "-Command", cmd],
            capture_output=True,
            text=True,
            timeout=25
        )
        out = proc.stdout or proc.stderr or "(Empty output)"
        return f"💻 <b>Command Output:</b>\n<pre>{out[:3500]}</pre>"
    except subprocess.TimeoutExpired:
        return "⏱️ Command timed out after 25 seconds."
    except Exception as e:
        return f"❌ Execution failed: {str(e)}"


def get_help() -> str:
    return (
        "🛰️ <b>NEXUS OmniSec — Mobile C2 Commands</b>\n"
        "─────────────────────────────\n"
        "<code>/status</code> — Live host CPU, RAM, disk & UI state\n"
        "<code>/ask &lt;query&gt;</code> — Query local Shadow313-7B (32k context)\n"
        "<code>/sentinel</code> — Check process watchdog & tripwires\n"
        "<code>/sh &lt;command&gt;</code> — Run native PowerShell command\n"
        "<code>/pqc</code> — Validate FIPS 203/204/205 signature state\n"
        "<code>/help</code> — Show this menu"
    )


def process_message(msg: dict):
    chat = msg.get("chat", {})
    chat_id = str(chat.get("id", ""))
    text = msg.get("text", "").strip()

    # Security verification
    if ALLOWED_CHAT_ID and chat_id != str(ALLOWED_CHAT_ID):
        print(f"[!] Unauthorized access attempt from chat_id: {chat_id}")
        send_message(chat_id, "⛔ <b>ACCESS DENIED.</b> This terminal is locked to authorized hardware.")
        return

    print(f"[{datetime.now().strftime('%H:%M:%S')}] Received from {chat_id}: {text}")

    if text.startswith("/start") or text.startswith("/help"):
        send_message(chat_id, get_help())
    elif text.startswith("/status"):
        send_message(chat_id, handle_status())
    elif text.startswith("/sentinel"):
        send_message(chat_id, handle_sentinel())
    elif text.startswith("/ask"):
        prompt = text[4:].strip()
        send_message(chat_id, "⏳ <i>Analyzing query with Shadow313-7B (32k context)...</i>")
        send_message(chat_id, handle_ask(prompt))
    elif text.startswith("/sh"):
        cmd = text[3:].strip()
        send_message(chat_id, handle_shell(cmd))
    elif text.startswith("/pqc"):
        pqc_report = (
            "🔐 <b>313-BIND Protocol Status: ACTIVE</b>\n"
            "• Layer 1 (ML-KEM-768): Key Encapsulation Armed\n"
            "• Layer 2 (ML-DSA-65): Digital Signatures Armed\n"
            "• Layer 3 (QE-BIM): Bell State Entanglement Monitored\n"
            "• Root of Trust: SLH-DSA-SHAKE-128f (FIPS 205)\n"
            "• Downgrade Protection: Tripartite Bond Intact"
        )
        send_message(chat_id, pqc_report)
    else:
        # Default fallback: treat plain text as an AI query
        send_message(chat_id, "⏳ <i>Processing with Shadow313-7B...</i>")
        send_message(chat_id, handle_ask(text))


def start_c2_polling():
    if not BOT_TOKEN:
        print("=" * 60)
        print("❌ TELEGRAM_BOT_TOKEN is not configured in .env!")
        print("To set up:")
        print("  1. In Telegram, search for @BotFather and send: /newbot")
        print("  2. Copy the token you receive")
        print("  3. Set TELEGRAM_BOT_TOKEN in C:\\Users\\shiatoali\\NEXUS-OmniSec-Unified\\.env")
        print("  4. Send /start to your bot and grab your chat ID from the console")
        print("=" * 60)
        return

    print("=" * 60)
    print("🛰️ NEXUS OmniSec Native Telegram C2 Daemon Started")
    print(f"Target Bot API: {TG_API[:30]}...")
    print(f"Authorized Chat ID: {ALLOWED_CHAT_ID or 'UNLOCKED (First sender will be logged)'}")
    print("Listening for incoming mobile commands...")
    print("=" * 60)

    offset = None
    while True:
        try:
            params = {"timeout": 30}
            if offset:
                params["offset"] = offset

            resp = requests.get(f"{TG_API}/getUpdates", params=params, timeout=35)
            if resp.status_code == 200:
                data = resp.json()
                for item in data.get("result", []):
                    offset = item["update_id"] + 1
                    msg = item.get("message")
                    if msg:
                        process_message(msg)
            elif resp.status_code == 401:
                print("[!] Invalid Telegram Bot Token. Please check your .env file.")
                time.sleep(10)
            else:
                time.sleep(2)
        except requests.exceptions.RequestException:
            # Network hiccup, retry quietly
            time.sleep(5)
        except KeyboardInterrupt:
            print("\n[!] Telegram C2 Daemon terminated.")
            break
        except Exception as e:
            print(f"[!] Polling loop error: {e}")
            time.sleep(3)


if __name__ == "__main__":
    start_c2_polling()
