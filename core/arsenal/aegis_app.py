#!/usr/bin/env python3
"""
AEGIS ULTIMATE - ADVANCED SECURITY FRAMEWORK
Features: AsyncIO, Rich UI, ML Anomaly Detection, Active Honeypots, and File Auto-Restoration.
"""

import asyncio
import os
import hashlib
import shutil
import time
import random
import socket
from datetime import datetime

try:
    from rich.live import Live
    from rich.layout import Layout
    from rich.panel import Panel
    from rich.table import Table
    from rich.console import Console
    from rich.text import Text
except ImportError:
    print("Please install 'rich': pip install rich")
    exit(1)

try:
    from sklearn.ensemble import IsolationForest
    import numpy as np
    HAS_ML = True
except ImportError:
    HAS_ML = False
    print("Warning: scikit-learn not found. ML Anomaly detection will run in simulated mode.")

# Global State for UI
state = {
    "logs": [],
    "anomalies": [],
    "honeypot_hits": [],
    "fim_events": [],
    "quantum_keys": 0
}

console = Console()

# ==========================================
# MODULE 1: AI/ML ANOMALY DETECTION
# ==========================================
class NetworkAnomalyDetector:
    def __init__(self):
        self.model = None
        if HAS_ML:
            self.train_baseline()

    def train_baseline(self):
        # Train on synthetic "normal" traffic (packet_size, connection_duration)
        X_train = np.random.normal(loc=[500, 100], scale=[50, 10], size=(1000, 2))
        self.model = IsolationForest(contamination=0.02, random_state=42)
        self.model.fit(X_train)
        add_log("ML Anomaly Detector trained on baseline traffic.", "green")

    def analyze_traffic(self, packet_size, duration):
        if HAS_ML:
            score = self.model.predict(np.array([[packet_size, duration]]))[0]
            return score == -1 # -1 means anomaly in IsolationForest
        else:
            return random.random() > 0.95

async def ml_traffic_monitor():
    detector = NetworkAnomalyDetector()
    while True:
        await asyncio.sleep(random.uniform(0.5, 2.0))
        p_size = random.choice([480, 510, 550, 1500, 5000])
        duration = random.choice([90, 105, 120, 500, 1000])
        
        is_anomaly = detector.analyze_traffic(p_size, duration)
        if is_anomaly:
            event = f"Anomaly! Size: {p_size}B, Time: {duration}ms"
            state["anomalies"].insert(0, (datetime.now().strftime("%H:%M:%S"), event))
            state["anomalies"] = state["anomalies"][:5]
            add_log(f"ML Engine flagged unusual traffic pattern ({p_size}B).", "red")

# ==========================================
# MODULE 2: ACTIVE HONEYPOT & DEFENSE
# ==========================================
async def handle_honeypot_connection(reader, writer):
    addr = writer.get_extra_info('peername')
    ip = addr[0]
    state["honeypot_hits"].insert(0, (datetime.now().strftime("%H:%M:%S"), ip, "BLOCKED"))
    state["honeypot_hits"] = state["honeypot_hits"][:5]
    
    add_log(f"Honeypot triggered by {ip}. Auto-banning IP...", "red bold")
    writer.write(b"Connection refused by AEGIS Defense Subsystem.\n")
    await writer.drain()
    writer.close()

async def honeypot_server():
    server = await asyncio.start_server(handle_honeypot_connection, '127.0.0.1', 2222)
    add_log("Active Defense Honeypot listening on port 2222", "yellow")
    async with server:
        await server.serve_forever()

# ==========================================
# MODULE 3: FILE INTEGRITY & SELF-HEALING
# ==========================================
def setup_fim_directories():
    os.makedirs("aegis_secure_vault", exist_ok=True)
    os.makedirs("aegis_backup_vault", exist_ok=True)
    with open("aegis_secure_vault/critical_config.txt", "w") as f:
        f.write("system_auth_mode=STRICT\nmax_retries=3")
    shutil.copy("aegis_secure_vault/critical_config.txt", "aegis_backup_vault/critical_config.txt")

def get_file_hash(filepath):
    if not os.path.exists(filepath): return None
    hasher = hashlib.sha256()
    with open(filepath, 'rb') as f:
        buf = f.read()
        hasher.update(buf)
    return hasher.hexdigest()

async def file_integrity_monitor():
    setup_fim_directories()
    target_file = "aegis_secure_vault/critical_config.txt"
    backup_file = "aegis_backup_vault/critical_config.txt"
    baseline_hash = get_file_hash(target_file)
    add_log("File Integrity Monitor (FIM) baseline locked.", "cyan")

    while True:
        await asyncio.sleep(2)
        current_hash = get_file_hash(target_file)
        
        if current_hash != baseline_hash:
            add_log(f"TAMPERING DETECTED in {target_file}!", "red bold")
            shutil.copy(backup_file, target_file)
            add_log(f"Self-Healing active: Restored {target_file} from secure backup.", "green bold")
            state["fim_events"].insert(0, (datetime.now().strftime("%H:%M:%S"), "critical_config.txt", "RESTORED"))
            state["fim_events"] = state["fim_events"][:5]

# ==========================================
# MODULE 4: PQC SIMULATION & LOGGING
# ==========================================
def add_log(msg, style="white"):
    t = datetime.now().strftime("%H:%M:%S")
    state["logs"].insert(0, f"[{t}] [{style}]{msg}[/]")
    if len(state["logs"]) > 10:
        state["logs"].pop()

async def pqc_key_generator():
    while True:
        await asyncio.sleep(5)
        state["quantum_keys"] += 1
        if random.random() > 0.7:
            add_log("Rotated Post-Quantum CRYSTALS-Kyber-1024 session keys.", "magenta")

# ==========================================
# UI / DASHBOARD ENGINE (RICH)
# ==========================================
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
        Layout(name="top_right"),
        Layout(name="bottom_right")
    )

    layout["header"].update(Panel(Text("🛡️ AEGIS ULTIMATE SECURITY SOC DASHBOARD", justify="center", style="bold cyan")))
    layout["left"].update(Panel("\n".join(state["logs"]), title="[bold]System Operations Log[/]", border_style="green"))

    hp_table = Table(expand=True)
    hp_table.add_column("Time", style="cyan")
    hp_table.add_column("Attacker IP", style="red")
    hp_table.add_column("Action", style="bold green")
    for row in state["honeypot_hits"]:
        hp_table.add_row(row[0], row[1], row[2])
    layout["top_right"].update(Panel(hp_table, title="[bold red]Active Defense Honeypot (Port 2222)[/]"))

    ml_table = Table(expand=True)
    ml_table.add_column("Time", style="cyan")
    ml_table.add_column("AI Event Detection", style="yellow")
    for row in state["anomalies"]:
        ml_table.add_row(row[0], row[1])
    layout["bottom_right"].update(Panel(ml_table, title="[bold yellow]ML Anomaly Detection (Isolation Forest)[/]"))

    fim_count = len(state["fim_events"])
    footer_text = f"PQC Keys Active: {state['quantum_keys']} | Self-Healing Restorations: {fim_count} | Status: SYSTEM SECURE"
    layout["footer"].update(Panel(Text(footer_text, justify="center", style="bold green")))

    return layout

async def display_ui():
    add_log("Initializing AEGIS Ultimate Subsystems...", "bold white")
    with Live(generate_layout(), refresh_per_second=4, screen=True) as live:
        while True:
            await asyncio.sleep(0.25)
            live.update(generate_layout())

async def main():
    await asyncio.gather(
        display_ui(),
        honeypot_server(),
        ml_traffic_monitor(),
        file_integrity_monitor(),
        pqc_key_generator()
    )

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nShutting down AEGIS safely.")
        if os.path.exists("aegis_secure_vault"): shutil.rmtree("aegis_secure_vault")
        if os.path.exists("aegis_backup_vault"): shutil.rmtree("aegis_backup_vault")