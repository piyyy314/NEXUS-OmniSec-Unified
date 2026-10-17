import requests
import time
import random

# --- Configuration ---
TARGET_URL = "http://example.com" # The system you are ethically auditing
# A list of common browser 'User-Agents' to rotate through
USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.3 Mobile/15E148 Safari/604.1",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Firefox/89.0"
]

# Hidden paths we want to check for (The 'Bait')
PATHS_TO_AUDIT = ["/admin", "/config", "/.env", "/backup", "/dev", "/test.php"]

def ghost_scan():
    print(f"--- GHOST RECON ACTIVE ON: {TARGET_URL} ---")
    print("[*] Mode: Stealth / Asynchronous Jitter")
    print("-" * 50)

    for path in PATHS_TO_AUDIT:
        url = f"{TARGET_URL}{path}"
        
        # 1. Slick Header Rotation
        headers = {'User-Agent': random.choice(USER_AGENTS)}
        
        try:
            # 2. Perform the 'Recon'
            # We use a timeout so we don't get 'stuck' and look suspicious
            response = requests.get(url, headers=headers, timeout=5)
            
            if response.status_code == 200:
                print(f"[!] POTENTIAL VULNERABILITY FOUND: {url} (Accessible)")
            elif response.status_code == 403:
                print(f"[*] Path Protected: {path} (Requires credentials)")
            
        except Exception as e:
            print(f"[X] Connection Error on {path}: {e}")

        # 3. The 'Slick' Part: Randomized Jitter
        # We wait between 3 and 10 seconds before the next move.
        # This breaks the pattern that automated defense systems look for.
        sleep_time = random.uniform(3.0, 10.0)
        print(f"    -> Sleeping for {sleep_time:.2f}s to maintain stealth...")
        time.sleep(sleep_time)

    print("-" * 50)
    print("[√] Ghost Recon Mission Complete.")

if __name__ == "__main__":
    ghost_scan()