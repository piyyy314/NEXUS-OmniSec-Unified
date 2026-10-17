import time
import sys

def hardened_execution_wrapper(func):
    """
    A 'Guardian' function that runs your script logic.
    If the logic fails, it logs the error silently and restarts.
    """
    def wrapper(*args, **kwargs):
        while True:
            try:
                # Execute the core logic of your trap or tool
                func(*args, **kwargs)
            except KeyboardInterrupt:
                # Allow the user to stop it manually
                print("\n[!] Manual Shutdown Detected.")
                sys.exit(0)
            except Exception as e:
                # In a hardened system, we log the error to a hidden file
                # but we NEVER stop the script.
                with open(".sys_log_hidden", "a") as f:
                    f.write(f"[{time.ctime()}] Error Recovered: {str(e)}\n")
                
                # Wait 2 seconds and restart the 'Heartbeat'
                time.sleep(2)
                continue 
    return wrapper

@hardened_execution_wrapper
def core_logic():
    # Insert your Tarpit or Sentinel code here
    print("[*] System Heartbeat Stable...")
    # Example of a 'crash' that would normally stop a script:
    # 1/0 
    time.sleep(5)

if __name__ == "__main__":
    core_logic()