import socket
import threading
import subprocess
import time
import os
from fortress_config import TARPIT_PORT, CANARY_LISTEN_PORT

TARGET_IP = "127.0.0.1"

def stress_test_tarpit():
    print("[!] Chaos: Starting Tarpit Stress Test (50 connections)...")
    def connect():
        try:
            s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            s.settimeout(2)
            s.connect((TARGET_IP, TARPIT_PORT))
            time.sleep(1)
            s.close()
        except:
            pass

    threads = []
    for _ in range(50):
        t = threading.Thread(target=connect)
        t.start()
        threads.append(t)
    for t in threads:
        t.join()
    print("[√] Chaos: Tarpit stress test complete.")

def provoke_sentinel():
    print("[!] Chaos: Provoking Sentinel (Starting fake 'nc.exe')...")
    with open("nc.exe", "w") as f:
        f.write("This is a dummy file for stress testing.")
    try:
        proc = subprocess.Popen(["python", "-m", "http.server", "9999"], executable="python")
        print("[*] Chaos: Dummy process started. Checking if Sentinel kills it...")
        time.sleep(2)
    finally:
        if os.path.exists("nc.exe"):
            os.remove("nc.exe")

def test_listener_alert():
    print("[!] Chaos: Testing Canary Listener Alert...")
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.connect((TARGET_IP, CANARY_LISTEN_PORT))
        s.send(b"GET /test_ping HTTP/1.1\r\nHost: localhost\r\n\r\n")
        s.close()
        print("[√] Chaos: Alert trigger sent.")
    except Exception as e:
        print(f"[X] Chaos: Listener test failed: {e}")

if __name__ == "__main__":
    print("=== CHAOS ENGINE: STRESS TEST INITIALIZED ===")
    test_listener_alert()
    time.sleep(1)
    provoke_sentinel()
    time.sleep(1)
    stress_test_tarpit()
    print("=== STRESS TEST COMPLETE ===")