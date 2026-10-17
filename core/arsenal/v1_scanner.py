import socket
import threading
from queue import Queue
from datetime import datetime

# --- Configuration ---
target = "127.0.0.1"  # Replace with the IP you want to scan (localhost for testing)
port_range = 1024     # Will scan ports 1 to 1024
thread_count = 100    # Number of threads to run simultaneously

# Thread-safe queue to hold the port numbers
queue = Queue()
open_ports = []

def port_scan(port):
    """
    Tries to connect to a specific port. 
    Returns True if open, False if closed.
    """
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(1) # Wait 1 second max for a response
        result = sock.connect_ex((target, port))
        sock.close()
        
        if result == 0:
            return True
        else:
            return False
    except:
        return False

def worker():
    """
    Worker thread function.
    Pulls a port from the queue and scans it.
    """
    while not queue.empty():
        port = queue.get()
        if port_scan(port):
            print(f"Port {port} is OPEN")
            open_ports.append(port)
        queue.task_done()

def run_scanner():
    print(f"Scanning target: {target}")
    print(f"Time started: {datetime.now()}")
    print("-" * 50)

    # 1. Fill the queue with port numbers
    for port in range(1, port_range + 1):
        queue.put(port)

    # 2. Create and start threads
    thread_list = []
    for _ in range(thread_count):
        thread = threading.Thread(target=worker)
        thread_list.append(thread)
        thread.start()

    # 3. Wait for all threads to finish
    for thread in thread_list:
        thread.join()

    print("-" * 50)
    print(f"Scan completed. Open ports: {open_ports}")

if __name__ == "__main__":
    run_scanner()