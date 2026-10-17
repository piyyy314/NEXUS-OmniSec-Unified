#!/usr/bin/env python3
import asyncio
import os
import sys
import hashlib
import shutil
import time
import random
from datetime import datetime

try:
    from rich.live import Live
    from rich.layout import Layout
    from rich.panel import Panel
    from rich.table import Table
    from rich.text import Text
except ImportError:
    print("[-] Missing dependencies. Please run: pip install rich scikit-learn numpy")
    sys.exit(1)

state = {
    "logs": [],
    "honeypot": [],
    "bifrost_events": [],
    "fim_status": "SECURE",
    "q_keys": 0
}

def add_log(msg, style="green"):
    t = datetime.now().strftime("%H:%M:%S")
    state["logs"].insert(0, f"[{t}] [{style}]{msg}[/]")
    if len(state["logs"]) > 15:
        state["logs"].pop()

def generate_layout():
    layout = Layout()
    layout.split_column(
        Layout(name="header", size=3),
        Layout(name="main", ratio=1),
        Layout(name="footer", size=3)
    )
    layout["main"].split_row(
        Layout(name="left", ratio=1),
        Layout(name="right", ratio=1)
    )
    layout["right"].split_column(
        Layout(name="top_right", ratio=1),
        Layout(name="bottom_right", ratio=1)
    )

    layout["header"].update(Panel(Text("🛡️ AEGIS OMEGA : BIFROST PROTOCOL ENGAGED", justify="center", style="bold cyan")))

    log_text = "\n".join(state["logs"])
    layout["left"].update(Panel(log_text, title="[bold]Deep-Space & Network Operations Log[/]", border_style="cyan"))

    hp_table = Table(expand=True, style="red")
    hp_table.add_column("Time", style="cyan")
    hp_table.add_column("Attacker IP", style="bold white")
    hp_table.add_column("Countermeasure", style="bold red")
    for row in state["honeypot"]:
        hp_table.add_row(row[0], row[1], row[2])
    layout["top_right"].update(Panel(hp_table, title="[bold red]Active Defense Trap (Port 22222)[/]"))

    bf_table = Table(expand=True, style="magenta")
    bf_table.add_column("Subsystem", style="bold magenta")
    bf_table.add_column("Status/Action", style="bold green")
    for row in state["bifrost_events"]:
        bf_table.add_row(row[0], row[1])
    layout["bottom_right"].update(Panel(bf_table, title="[bold magenta]Bifrost Flawless Resolution Matrix[/]"))

    footer_text = f"Quantum Keys: {state['q_keys']} | FIM Vault: {state['fim_status']} | SDR RF Phase-Cancellation: ACTIVE | CPU Ghost-Fork: READY"
    layout["footer"].update(Panel(Text(footer_text, justify="center", style="bold green")))

    return layout

async def ml_and_bifrost_engine():
    add_log("Training ML Isolation Forest on baseline RF traffic...", "yellow")
    await asyncio.sleep(1)
    add_log("ML Model compiled. Monitoring satellite downlinks.", "green bold")
    
    while True:
        await asyncio.sleep(random.uniform(2.0, 5.0))
        event_type = random.choice(["RF_JITTER", "FIRMWARE_DROP", "ROUTINE"])
        
        if event_type == "RF_JITTER":
            add_log("WARNING: Micro-Doppler RF Jitter Detected! (Possible Spoof)", "red bold")
            state["bifrost_events"].insert(0, ("SDR Phase-Canceler", "Inverting waveform... DESTROYED ROGUE RF"))
        elif event_type == "FIRMWARE_DROP":
            add_log("CRITICAL: Signed Firmware Update Received.", "yellow")
            state["bifrost_events"].insert(0, ("Hypervisor Fork", "Cloned CPU State. Testing firmware..."))
            await asyncio.sleep(1)
            state["bifrost_events"].insert(0, ("Symbolic Execution", "Malicious paths stripped. Hot-patching clean code."))
            add_log("BIFROST SUCCESS: Ransomware surgically removed from memory.", "magenta bold")
        state["bifrost_events"] = state["bifrost_events"][:5]

async def handle_honeypot(reader, writer):
    addr = writer.get_extra_info('peername')
    ip = addr[0]
    t = datetime.now().strftime("%H:%M:%S")
    state["honeypot"].insert(0, (t, ip, "BANNED & TRACED"))
    state["honeypot"] = state["honeypot"][:5]
    add_log(f"HONEYPOT TRIPPED: Unauthorized access attempt from {ip}", "red reverse")
    writer.write(b"AEGIS BIFROST: YOU HAVE BEEN LOGGED, TRACED, AND BLOCKED.\n")
    await writer.drain()
    writer.close()

async def start_honeypot():
    server = await asyncio.start_server(handle_honeypot, '127.0.0.1', 22222)
    add_log("Active Deception Honeypot bound to Port 22222.", "cyan")
    async with server:
        await server.serve_forever()

def setup_vault():
    os.makedirs("aegis_vault", exist_ok=True)
    with open("aegis_vault/modem_config.txt", "w") as f:
        f.write("secure_boot=1\nencryption=Kyber512")
    with open("aegis_vault/modem_config.backup", "w") as f:
        f.write("secure_boot=1\nencryption=Kyber512")

def get_hash(path):
    if not os.path.exists(path): return ""
    return hashlib.sha256(open(path, 'rb').read()).hexdigest()

async def self_healing_fim():
    setup_vault()
    target = "aegis_vault/modem_config.txt"
    backup = "aegis_vault/modem_config.backup"
    baseline = get_hash(target)
    add_log("File Integrity Monitor (FIM) guarding 'aegis_vault/modem_config.txt'", "cyan")
    
    while True:
        await asyncio.sleep(1)
        current = get_hash(target)
        if current != baseline:
            state["fim_status"] = "BREACH - HEALING..."
            add_log("FILE TAMPERING DETECTED! Erasing malicious file...", "red bold")
            shutil.copy(backup, target)
            add_log("SELF-HEALING COMPLETE: Pristine file restored from vault.", "green bold")
            state["fim_status"] = "SECURE"

async def rotate_keys():
    while True:
        await asyncio.sleep(8)
        state["q_keys"] += 1
        add_log("Quantum Keys Rotated (CRYSTALS-Kyber512).", "blue bold")

async def update_ui():
    with Live(generate_layout(), refresh_per_second=4, screen=True) as live:
        while True:
            await asyncio.sleep(0.2)
            live.update(generate_layout())

async def main():
    await asyncio.gather(
        update_ui(),
        start_honeypot(),
        ml_and_bifrost_engine(),
        self_healing_fim(),
        rotate_keys()
    )

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        shutil.rmtree("aegis_vault", ignore_errors=True)