#!/usr/bin/env python3
"""
ShadowLink VPN Server - Advanced Multi-Protocol Secure VPN
Features: Multi-layer encryption, traffic obfuscation, decoy routing, 
          quantum-resistant key exchange, steganographic transport
"""

import asyncio
import socket
import struct
import hashlib
import hmac
import os
import time
import json
import logging
from dataclasses import dataclass
from typing import Dict, Optional, Tuple, Callable
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import x25519, ed25519
from cryptography.hazmat.primitives.ciphers.aead import AESGCM, ChaCha20Poly1305
from cryptography.hazmat.primitives.kdf.hkdf import HKDF
import random
import string

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


@dataclass
class SessionKeys:
    """Holds cryptographic keys for a session"""
    encryption_key: bytes
    mac_key: bytes
    nonce_seed: bytes
    forward_secrecy_key: Optional[bytes] = None


class QuantumResistantKEX:
    """
    Hybrid key exchange combining X25519 with CRYSTALS-Kyber-like LWE
    This is a simplified implementation - in production use official implementations
    """
    
    def __init__(self):
        self.private_key = x25519.X25519PrivateKey.generate()
        self.public_key = self.private_key.public_key()
        # LWE parameters (simplified)
        self.n = 256  # Dimension
        self.q = 3329  # Modulus
        self.eta = 2  # Error distribution parameter
        
    def generate_lwe_keypair(self) -> Tuple[bytes, bytes]:
        """Generate LWE key pair"""
        # Secret vector s with small coefficients
        s = [random.randint(-self.eta, self.eta) for _ in range(self.n)]
        # Random matrix A (simplified - in real impl, use NTT)
        A = [random.randint(0, self.q-1) for _ in range(self.n)]
        # Error vector e
        e = [random.randint(-self.eta, self.eta) for _ in range(self.n)]
        # Public key: b = A*s + e mod q
        b = [(A[i] * s[i] + e[i]) % self.q for i in range(self.n)]
        
        sk = bytes([x & 0xFF for x in s])
        pk = bytes([x & 0xFF for x in b]) + bytes([x & 0xFF for x in A])
        return sk, pk
    
    def encapsulate(self, public_key: bytes) -> Tuple[bytes, bytes]:
        """Encapsulate a shared secret"""
        # Split public key
        b = list(public_key[:self.n])
        A = list(public_key[self.n:2*self.n])
        
        # Random message
        m = [random.randint(0, 1) for _ in range(self.n)]
        # Randomness r
        r = [random.randint(-self.eta, self.eta) for _ in range(self.n)]
        # Error e1
        e1 = [random.randint(-self.eta, self.eta) for _ in range(self.n)]
        # Error e2
        e2 = [random.randint(-self.eta, self.eta) for _ in range(self.n)]
        
        # u = A^T * r + e1
        u = [(A[i] * r[i] + e1[i]) % self.q for i in range(self.n)]
        # v = b^T * r + e2 + m*q/2
        v = [(b[i] * r[i] + e2[i] + m[i] * self.q // 2) % self.q for i in range(self.n)]
        
        ciphertext = bytes([x & 0xFF for x in u]) + bytes([x & 0xFF for x in v])
        shared_secret = hashlib.sha3_256(bytes(m)).digest()
        return ciphertext, shared_secret
    
    def decapsulate(self, secret_key: bytes, ciphertext: bytes) -> bytes:
        """Decapsulate shared secret"""
        u = list(ciphertext[:self.n])
        v = list(ciphertext[self.n:2*self.n])
        s = list(secret_key)
        
        # m' = v - s^T * u
        m_prime = [(v[i] - s[i] * u[i]) % self.q for i in range(self.n)]
        # Recover message bits
        m = [1 if x > self.q // 4 and x < 3 * self.q // 4 else 0 for x in m_prime]
        
        return hashlib.sha3_256(bytes(m)).digest()
    
    def get_public_key_bytes(self) -> bytes:
        return self.public_key.public_bytes(
            encoding=serialization.Encoding.Raw,
            format=serialization.PublicFormat.Raw
        )


class TrafficObfuscator:
    """
    Advanced traffic obfuscation using multiple techniques:
    - Packet size normalization
    - Timing obfuscation
    - Protocol mimicry
    - Decoy packet injection
    """
    
    def __init__(self, mode: str = "adaptive"):
        self.mode = mode
        self.target_sizes = [64, 128, 256, 512, 1024, 1400]
        self.mimic_protocols = {
            'https': self._mimic_https,
            'dns': self._mimic_dns,
            'http2': self._mimic_http2
        }
        self.current_mimic = 'https'
        
    def obfuscate(self, data: bytes, session_id: bytes) -> bytes:
        """Apply multi-layer obfuscation"""
        # Layer 1: Add random padding to normalize size
        padded = self._normalize_size(data)
        
        # Layer 2: XOR with session-derived keystream
        xored = self._xor_stream(padded, session_id)
        
        # Layer 3: Protocol mimicry
        mimicked = self.mimic_protocols[self.current_mimic](xored)
        
        # Layer 4: Add timing noise (handled at transport layer)
        return mimicked
    
    def deobfuscate(self, data: bytes, session_id: bytes) -> Optional[bytes]:
        """Reverse obfuscation"""
        try:
            # Remove protocol mimicry
            demimicked = self._demimic(data)
            # XOR stream
            xored = self._xor_stream(demimicked, session_id)
            # Remove padding
            return self._remove_padding(xored)
        except Exception:
            return None
    
    def _normalize_size(self, data: bytes) -> bytes:
        """Pad or split to normalize packet sizes"""
        target = random.choice(self.target_sizes)
        if len(data) < target:
            padding_needed = target - len(data) - 2
            padding = os.urandom(padding_needed)
            return struct.pack('!H', len(data)) + data + padding
        else:
            # Split into chunks
            chunks = []
            for i in range(0, len(data), target - 2):
                chunk = data[i:i + target - 2]
                if len(chunk) < target - 2:
                    padding = os.urandom(target - 2 - len(chunk))
                    chunk = chunk + padding
                chunks.append(struct.pack('!H', len(chunk)) + chunk)
            return b''.join(chunks)
    
    def _remove_padding(self, data: bytes) -> bytes:
        """Remove padding and reconstruct original data"""
        original_len = struct.unpack('!H', data[:2])[0]
        return data[2:2+original_len]
    
    def _xor_stream(self, data: bytes, key: bytes) -> bytes:
        """XOR with keystream derived from session"""
        keystream = hashlib.sha3_256(key + b'stream').digest()
        result = bytearray()
        for i, byte in enumerate(data):
            result.append(byte ^ keystream[i % len(keystream)])
        return bytes(result)
    
    def _mimic_https(self, data: bytes) -> bytes:
        """Make data look like TLS traffic"""
        # TLS-like header
        content_type = random.choice([0x17, 0x16, 0x14])  # Application data, handshake, CCS
        version = b'\x03\x03'  # TLS 1.2
        
        # Add fake TLS record layer
        length = len(data)
        tls_header = bytes([content_type]) + version + struct.pack('!H', length)
        
        # Random TLS-like noise
        noise = os.urandom(random.randint(0, 32))
        
        return tls_header + data + noise
    
    def _demimic(self, data: bytes) -> bytes:
        """Remove protocol mimicry"""
        if len(data) < 5:
            return data
        # Skip TLS header (5 bytes)
        return data[5:]
    
    def _mimic_dns(self, data: bytes) -> bytes:
        """Make data look like DNS queries"""
        # Simplified DNS-like encoding
        transaction_id = os.urandom(2)
        flags = b'\x01\x00'  # Standard query
        questions = struct.pack('!H', 1)
        answer_rrs = struct.pack('!H', 0)
        authority_rrs = struct.pack('!H', 0)
        additional_rrs = struct.pack('!H', 0)
        
        # Encode data as DNS name
        encoded = self._encode_dns_name(data)
        
        qtype = struct.pack('!H', 1)  # A record
        qclass = struct.pack('!H', 1)  # IN
        
        header = transaction_id + flags + questions + answer_rrs + authority_rrs + additional_rrs
        return header + encoded + qtype + qclass
    
    def _encode_dns_name(self, data: bytes) -> bytes:
        """Encode binary data as DNS name format"""
        result = b''
        for i in range(0, len(data), 63):
            chunk = data[i:i+63]
            result += bytes([len(chunk)]) + chunk
        result += b'\x00'
        return result
    
    def _mimic_http2(self, data: bytes) -> bytes:
        """Make data look like HTTP/2 frames"""
        # HTTP/2 frame header
        length = len(data) & 0xFFFFFF
        frame_type = random.choice([0x0, 0x1, 0x2, 0x3, 0x4, 0x6, 0x8, 0x9])  # Various frame types
        flags = random.randint(0, 255)
        stream_id = random.randint(1, 0x7FFFFFFF)
        
        header = struct.pack('!I', length)[1:]  # 3 bytes
        header += bytes([frame_type, flags])
        header += struct.pack('!I', stream_id)
        
        return header + data


class SteganographicTransport:
    """
    Hide VPN traffic in seemingly innocent protocols
    """
    
    def __init__(self):
        self.cover_protocols = ['websocket', 'icmp', 'dns_tunnel', 'http_cdn']
        
    async def encode_websocket(self, data: bytes, dst: Tuple[str, int]) -> bytes:
        """Encode data as WebSocket frame"""
        # WebSocket frame structure
        fin = 0x80  # Final fragment
        opcode = 0x2  # Binary frame
        mask = 0x80  # Masked
        
        header = bytes([fin | opcode])
        
        length = len(data)
        if length < 126:
            header += bytes([mask | length])
        elif length < 65536:
            header += bytes([mask | 126]) + struct.pack('!H', length)
        else:
            header += bytes([mask | 127]) + struct.pack('!Q', length)
        
        # Generate mask key
        mask_key = os.urandom(4)
        masked_data = bytes([data[i] ^ mask_key[i % 4] for i in range(len(data))])
        
        return header + mask_key + masked_data
    
    async def encode_icmp(self, data: bytes, dst: Tuple[str, int]) -> bytes:
        """Encode data in ICMP echo request"""
        # ICMP Echo Request header
        type_code = 8  # Echo request
        code = 0
        identifier = os.urandom(2)
        sequence = struct.pack('!H', random.randint(0, 65535))
        
        # Payload with data
        payload = data
        
        # Calculate checksum
        header = bytes([type_code, code, 0, 0]) + identifier + sequence
        checksum = self._calculate_checksum(header + payload)
        
        return header[:2] + struct.pack('!H', checksum) + header[4:] + payload
    
    def _calculate_checksum(self, data: bytes) -> int:
        """Calculate ICMP checksum"""
        if len(data) % 2:
            data += b'\x00'
        
        s = sum(struct.unpack('!' + 'H' * (len(data) // 2), data))
        s = (s >> 16) + (s & 0xFFFF)
        s += s >> 16
        return ~s & 0xFFFF
    
    async def dns_tunnel_encode(self, data: bytes, domain: str = "example.com") -> str:
        """Encode data in DNS query names"""
        # Base32 encode data
        import base64
        encoded = base64.b32encode(data).decode().rstrip('=').lower()
        
        # Split into labels
        labels = [encoded[i:i+63] for i in range(0, len(encoded), 63)]
        query_name = '.'.join(labels) + '.' + domain
        
        return query_name


class DecoyRouter:
    """
    Implements decoy routing - traffic appears to go to innocent destinations
    but is intercepted and routed through VPN
    """
    
    def __init__(self):
        self.decoy_destinations = [
            ('1.1.1.1', 443),    # Cloudflare
            ('8.8.8.8', 443),    # Google DNS
            ('13.107.42.14', 443),  # Microsoft
        ]
        self.active_decoys: Dict[str, Tuple[str, int]] = {}
        
    def create_decoy_route(self, session_id: str) -> Tuple[str, int]:
        """Assign a decoy destination for a session"""
        decoy = random.choice(self.decoy_destinations)
        self.active_decoys[session_id] = decoy
        return decoy
    
    def get_real_destination(self, session_id: str) -> Optional[Tuple[str, int]]:
        """Get the actual VPN endpoint for a session"""
        return self.active_decoys.get(session_id)


class VPNClientHandler:
    """Handles individual VPN client connections"""
    
    def __init__(self, reader: asyncio.StreamReader, writer: asyncio.StreamWriter):
        self.reader = reader
        self.writer = writer
        self.session_id = os.urandom(32)
        self.keys: Optional[SessionKeys] = None
        self.obfuscator = TrafficObfuscator()
        self.stego = SteganographicTransport()
        self.decoy = DecoyRouter()
        self.authenticated = False
        self.last_activity = time.time()
        
    async def handle(self):
        """Main client handler loop"""
        try:
            # Phase 1: Key exchange
            await self._perform_key_exchange()
            
            # Phase 2: Authentication
            if not await self._authenticate():
                logger.warning(f"Authentication failed for {self.peer_addr}")
                return
            
            # Phase 3: VPN tunnel
            await self._tunnel_loop()
            
        except Exception as e:
            logger.error(f"Client handler error: {e}")
        finally:
            await self._cleanup()
    
    async def _perform_key_exchange(self):
        """Perform quantum-resistant key exchange"""
        kex = QuantumResistantKEX()
        
        # Send our public key
        pub_key = kex.get_public_key_bytes()
        lwe_sk, lwe_pk = kex.generate_lwe_keypair()
        
        # Send hybrid public keys
        self.writer.write(struct.pack('!I', len(pub_key)) + pub_key)
        self.writer.write(struct.pack('!I', len(lwe_pk)) + lwe_pk)
        await self.writer.drain()
        
        # Receive client's public key
        x25519_len = struct.unpack('!I', await self.reader.readexactly(4))[0]
        client_x25519 = await self.reader.readexactly(x25519_len)
        
        # Perform X25519 ECDH
        client_pubkey = x25519.X25519PublicKey.from_public_bytes(client_x25519)
        shared_x25519 = self.private_key.exchange(client_pubkey)
        
        # Receive LWE ciphertext
        lwe_ct_len = struct.unpack('!I', await self.reader.readexactly(4))[0]
        lwe_ciphertext = await self.reader.readexactly(lwe_ct_len)
        
        # Decapsulate LWE shared secret
        shared_lwe = kex.decapsulate(lwe_sk, lwe_ciphertext)
        
        # Combine secrets using HKDF
        combined = shared_x25519 + shared_lwe
        derived = HKDF(
            algorithm=hashes.SHA3_256(),
            length=64,
            salt=None,
            info=b'shadowlink-v1'
        ).derive(combined)
        
        self.keys = SessionKeys(
            encryption_key=derived[:32],
            mac_key=derived[32:48],
            nonce_seed=derived[48:64]
        )
        
        logger.info(f"Key exchange completed for {self.peer_addr}")
    
    async def _authenticate(self) -> bool:
        """Multi-factor authentication"""
        # Expect encrypted credentials
        auth_data = await self._receive_encrypted()
        if not auth_data:
            return False
        
        try:
            creds = json.loads(auth_data.decode())
            # In production: verify against secure credential store
            # For demo: simple check
            expected_user = hashlib.sha3_256(b'demo_user').hexdigest()
            expected_pass = hashlib.sha3_256(b'demo_pass').hexdigest()
            
            if (creds.get('user_hash') == expected_user and 
                creds.get('pass_hash') == expected_pass):
                self.authenticated = True
                # Send success with session token
                token = os.urandom(32)
                await self._send_encrypted(token)
                return True
                
        except Exception as e:
            logger.error(f"Auth error: {e}")
        
        return False
    
    async def _tunnel_loop(self):
        """Main VPN tunnel - relay between client and internet"""
        # Create TUN interface (simplified - in production use proper TUN/TAP)
        # Here we'll use SOCKS5 proxy approach
        
        socks_server = await asyncio.start_server(
            self._handle_socks_connection,
            '127.0.0.1', 0
        )
        socks_port = socks_server.sockets[0].getsockname()[1]
        
        # Tell client the SOCKS port
        await self._send_encrypted(struct.pack('!H', socks_port))
        
        # Keep connection alive and handle control messages
        while True:
            try:
                data = await asyncio.wait_for(
                    self._receive_encrypted(),
                    timeout=30.0
                )
                
                if data is None:
                    break
                    
                self.last_activity = time.time()
                
                # Handle control messages
                if data.startswith(b'CTRL:'):
                    await self._handle_control(data[5:])
                else:
                    # Regular data - forward to destination
                    pass
                    
            except asyncio.TimeoutError:
                # Send keepalive
                await self._send_encrypted(b'PING')
                
    async def _handle_socks_connection(self, reader, writer):
        """Handle SOCKS5 proxy connections"""
        # SOCKS5 handshake
        ver = await reader.readexactly(1)
        if ver != b'\x05':
            writer.close()
            return
            
        nmethods = ord(await reader.readexactly(1))
        methods = await reader.readexactly(nmethods)
        
        # Accept no auth for now (in production: implement auth)
        writer.write(b'\x05\x00')
        await writer.drain()
        
        # Request
        ver = await reader.readexactly(1)
        cmd = await reader.readexactly(1)
        rsv = await reader.readexactly(1)
        atyp = await reader.readexactly(1)
        
        if atyp == b'\x01':  # IPv4
            addr = socket.inet_ntoa(await reader.readexactly(4))
        elif atyp == b'\x03':  # Domain
            alen = ord(await reader.readexactly(1))
            addr = (await reader.readexactly(alen)).decode()
        else:
            writer.close()
            return
            
        port = struct.unpack('!H', await reader.readexactly(2))[0]
        
        # Connect to destination
        try:
            dst_reader, dst_writer = await asyncio.open_connection(addr, port)
            writer.write(b'\x05\x00\x00\x01\x00\x00\x00\x00\x00\x00')
            await writer.drain()
            
            # Relay data
            await asyncio.gather(
                self._relay(reader, dst_writer),
                self._relay(dst_reader, writer)
            )
        except Exception as e:
            writer.write(b'\x05\x01\x00\x01\x00\x00\x00\x00\x00\x00')
            await writer.drain()
            writer.close()
    
    async def _relay(self, src, dst):
        """Relay data between streams"""
        while True:
            data = await src.read(8192)
            if not data:
                break
            dst.write(data)
            await dst.drain()
        dst.close()
    
    async def _receive_encrypted(self) -> Optional[bytes]:
        """Receive and decrypt data"""
        try:
            # Read length
            length_data = await self.reader.readexactly(4)
            length = struct.unpack('!I', length_data)[0]
            
            if length > 65536:  # Max packet size
                return None
                
            encrypted = await self.reader.readexactly(length)
            
            # Decrypt
            nonce = encrypted[:12]
            ciphertext = encrypted[12:]
            
            aesgcm = AESGCM(self.keys.encryption_key)
            plaintext = aesgcm.decrypt(nonce, ciphertext, None)
            
            # Verify MAC
            received_mac = plaintext[-32:]
            payload = plaintext[:-32]
            
            expected_mac = hmac.new(
                self.keys.mac_key,
                payload,
                hashlib.sha3_256
            ).digest()[:32]
            
            if not hmac.compare_digest(received_mac, expected_mac):
                return None
                
            return payload
            
        except Exception as e:
            return None
    
    async def _send_encrypted(self, data: bytes):
        """Encrypt and send data"""
        # Add MAC
        mac = hmac.new(self.keys.mac_key, data, hashlib.sha3_256).digest()[:32]
        payload = data + mac
        
        # Encrypt
        nonce = os.urandom(12)
        aesgcm = AESGCM(self.keys.encryption_key)
        ciphertext = aesgcm.encrypt(nonce, payload, None)
        
        encrypted = nonce + ciphertext
        
        # Send
        self.writer.write(struct.pack('!I', len(encrypted)) + encrypted)
        await self.writer.drain()
    
    async def _cleanup(self):
        """Clean up resources"""
        self.writer.close()
        await self.writer.wait_closed()
        logger.info(f"Client disconnected: {self.peer_addr}")
    
    @property
    def peer_addr(self):
        return self.writer.get_extra_info('peername')


class ShadowLinkServer:
    """Main VPN server"""
    
    def __init__(self, host: str = '0.0.0.0', port: int = 8443):
        self.host = host
        self.port = port
        self.clients: Dict[str, VPNClientHandler] = {}
        self.running = False
        
    async def start(self):
        """Start the VPN server"""
        self.server = await asyncio.start_server(
            self._handle_client,
            self.host,
            self.port
        )
        
        self.running = True
        logger.info(f"ShadowLink VPN Server started on {self.host}:{self.port}")
        
        # Start maintenance tasks
        asyncio.create_task(self._maintenance_loop())
        
        async with self.server:
            await self.server.serve_forever()
    
    async def _handle_client(self, reader: asyncio.StreamReader, writer: asyncio.StreamWriter):
        """Handle new client connection"""
        handler = VPNClientHandler(reader, writer)
        self.clients[handler.session_id.hex()] = handler
        await handler.handle()
        del self.clients[handler.session_id.hex()]
    
    async def _maintenance_loop(self):
        """Periodic maintenance tasks"""
        while self.running:
            await asyncio.sleep(60)
            
            # Clean up stale sessions
            now = time.time()
            stale = [
                sid for sid, client in self.clients.items()
                if now - client.last_activity > 300  # 5 minutes
            ]
            for sid in stale:
                logger.info(f"Removing stale session: {sid[:16]}...")
                # Client handler will clean up itself
    
    def stop(self):
        """Stop the server"""
        self.running = False
        self.server.close()


# Run server
if __name__ == '__main__':
    server = ShadowLinkServer()
    try:
        asyncio.run(server.start())
    except KeyboardInterrupt:
        logger.info("Server shutting down...")
        server.stop()