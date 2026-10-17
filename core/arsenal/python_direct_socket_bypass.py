import socket
import json
import sys

def direct_socket_bridge(host='127.0.0.1', port=300, payload=None):
    """
    Directly bypasses AI gateway wrappers by opening a raw TCP socket 
    to the local inference server or fallback node.
    """
    if payload is None:
        payload = {
            "model": "llama3",
            "prompt": "ping_bypass",
            "stream": False
        }

    # Initialize raw TCP socket
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.settimeout(10.0)

    try:
        print(f"[*] Connecting directly to local socket target at {host}:{port}...")
        s.connect((host, port))
        
        # Format raw HTTP/1.1 POST payload
        data_str = json.dumps(payload)
        http_request = (
            f"POST /api/generate HTTP/1.1\r\n"
            f"Host: {host}:{port}\r\n"
            f"Content-Type: application/json\r\n"
            f"Content-Length: {len(data_str)}\r\n"
            f"Connection: close\r\n\r\n"
            f"{data_str}"
        )
        
        s.sendall(http_request.encode('utf-8'))
        
        # Read raw response data directly from the socket stream
        response = b""
        while True:
            chunk = s.recv(4096)
            if not chunk:
                break
            response += chunk
            
        print("[+] Raw socket transmission successful. Gateway dependency bypassed.")
        return response.decode('utf-8', errors='ignore')

    except Exception as e:
        print(f"[-] Socket bypass failed: {str(e)}", file=sys.stderr)
        return None
    finally:
        s.close()

if __name__ == "__main__":
    result = direct_socket_bridge()
    if result:
        print("\n--- SOCKET RESPONSE TRACE ---")
        print(result[:500]) # Print first 500 chars of raw payload trace