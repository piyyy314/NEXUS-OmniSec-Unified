import asyncio
import json
import sys
import time

class ShadowRouter:
    """
    Advanced Async Socket Router.
    Bypasses high-level gateway daemons by racing raw TCP sockets across multiple local/remote nodes.
    """
    def __init__(self, endpoints):
        # List of tuples: [("127.0.0.1", 11434), ("192.168.1.50", 8080)]
        self.endpoints = endpoints

    async def _raw_socket_request(self, host, port, payload):
        start_time = time.time()
        try:
            # Open raw async TCP connection
            reader, writer = await asyncio.wait_for(
                asyncio.open_connection(host, port), timeout=3.0
            )
            
            data_str = json.dumps(payload)
            http_request = (
                f"POST /api/generate HTTP/1.1\r\n"
                f"Host: {host}:{port}\r\n"
                f"Content-Type: application/json\r\n"
                f"Content-Length: {len(data_str)}\r\n"
                f"Connection: close\r\n\r\n"
                f"{data_str}"
            )
            
            writer.write(http_request.encode('utf-8'))
            await writer.drain()
            
            # Read response
            response = b""
            while True:
                chunk = await asyncio.wait_for(reader.read(4096), timeout=10.0)
                if not chunk:
                    break
                response += chunk
                
            writer.close()
            await writer.wait_closed()
            
            latency = (time.time() - start_time) * 1000
            print(f"[+] SUCCESS [{host}:{port}] - Latency: {latency:.2f}ms")
            return response.decode('utf-8', errors='ignore')
            
        except Exception as e:
            print(f"[-] FAILED [{host}:{port}] - {str(e)}")
            raise e

    async def race_endpoints(self, payload):
        print(f"[*] Racing {len(self.endpoints)} endpoints concurrently...")
        
        # Create async tasks for all target nodes
        tasks = [
            self._raw_socket_request(host, port, payload) 
            for host, port in self.endpoints
        ]
        
        # Return the very first successful connection, cancel the rest
        done, pending = await asyncio.wait(
            tasks, return_when=asyncio.FIRST_COMPLETED
        )
        
        for p in pending:
            p.cancel()
            
        for task in done:
            try:
                return task.result()
            except Exception:
                continue
                
        return None

if __name__ == "__main__":
    # Define primary and fallback local nodes
    target_nodes = [
        ("127.0.0.1", 300),   # Primary Target Node
        ("127.0.0.1", 11434), # Ollama Local Fallback
        ("127.0.0.1", 5000)   # Secondary Python worker
    ]
    
    test_payload = {
        "model": "llama3",
        "prompt": "Respond with 'SHADOW313_BYPASS_ACTIVE'",
        "stream": False
    }

    router = ShadowRouter(target_nodes)
    result = asyncio.run(router.race_endpoints(test_payload))
    
    if result:
        print("\n[!] WINNING RESPONSE ACQUIRED. GATEWAY BYPASSED.")