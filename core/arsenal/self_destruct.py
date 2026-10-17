import os
import sys
import shutil

# --- Configuration ---
# List all the files we deployed during our audit
FILES_TO_ERASE = [
    "ghost_recon.py", 
    "intel_scraper.py", 
    "ghost_shell.py", 
    "exfiltrator.py",
    "system_audit_report.zip"
]

def secure_delete(file_path):
    """
    Overwrites a file with zeros before deleting to prevent recovery.
    """
    if os.path.exists(file_path):
        try:
            # 1. Overwrite with zeros
            size = os.path.getsize(file_path)
            with open(file_path, "ba+", buffering=0) as f:
                f.write(b"\x00" * size)
            
            # 2. Remove the file
            os.remove(file_path)
            print(f"[√] Securely erased: {file_path}")
        except Exception as e:
            print(f"[X] Could not erase {file_path}: {e}")

def wipe_evidence():
    print("--- INITIATING SELF-DESTRUCT PROTOCOL ---")
    print("[*] Target: All offensive audit tools")
    print("-" * 40)

    # 1. Erase all tools in the list
    for file in FILES_TO_ERASE:
        secure_delete(file)

    # 2. The Final Act: The script deletes itself
    print("[!] Mission Complete. Erasing Self-Destruct Wrapper...")
    
    # We use a system command to delete the script after it finishes execution
    current_script = sys.argv[0]
    
    if os.name == 'nt': # Windows
        os.system(f"del {current_script}")
    else: # Linux/Mac
        os.system(f"rm {current_script}")

if __name__ == "__main__":
    wipe_evidence()