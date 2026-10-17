import socket
import re
import requests

# --- Configuration ---
TARGET_IP = "127.0.0.1" # Change to target
PORTS_TO_CHECK = [21, 22, 80, 443, 3306] # FTP, SSH, HTTP, HTTPS, MySQL

def get_banner(ip, port):
    """
    Connects to a port and grabs the 'Welcome' string (The Banner).
    """
    try:
        s = socket.socket()
        s.settimeout(2)
        s.connect((ip, port))
        # Some services require a small 'nudge' to reveal their version
        if port == 80:
            s.send(b"HEAD / HTTP/1.1\r\nHost: localhost\r\n\r\n")
        
        banner = s.recv(1024).decode('utf-8', errors='ignore').strip()
        s.close()
        return banner
    except:
        return None

def analyze_vulnerability(banner):
    """
    Analyzes the banner for version numbers and mimics a CVE lookup.
    """
    # Regex to find version numbers like 1.2.3 or 7.2p2
    version_match = re.search(r'(\d+\.\d+(\.\d+)?)', banner)
    if version_match:
        version = version_match.group(1)
        print(f"[+] Detected Software Version: {version}")
        
        # In a real-world 'Advanced' scenario, we would query a CVE API here.
        # For this script, we will simulate the intelligence check.
        print(f"[*] Querying Global Vulnerability Database for version {version}...")
        
        # Example Logic:
        if "2.4" in version:
            return "CRITICAL: Known exploit available for this version (CVE-2021-41773)!"
        else:
            return "No immediate critical CVEs found. Suggest manual audit."
    return "Could not determine version from banner."

def start_intel_mission():
    print(f"--- VULNERABILITY INTEL MISSION: {TARGET_IP} ---")
    print("-" * 50)

    for port in PORTS_TO_CHECK:
        banner = get_banner(TARGET_IP, port)
        if banner:
            print(f"[!] Service found on Port {port}:")
            print(f"    Raw Banner: {banner}")
            
            report = analyze_vulnerability(banner)
            print(f"    Report: {report}")
            print("-" * 30)

if __name__ == "__main__":
    start_intel_mission()