# Add this import at the top of your server script
import struct


# Inside your DNSTunnelResolver.__init__, add an in-memory session cache:
# self.session_buffers = defaultdict(dict)  # session_id -> { seq_num: data }


def resolve(self, request: DNSRecord, handler):
    self.request_counter += 1
    reply = request.reply()
    src_ip = handler.client_address[0]

    if self._is_blocked(src_ip):
        reply.add_answer(
            RR(request.q.qname, QTYPE.A, ttl=1, rdata=A("127.0.0.1"))
        )
        return reply

    bucket = self.ip_buckets[src_ip]
    if not bucket.consume():
        reply.add_answer(
            RR(request.q.qname, QTYPE.A, ttl=1, rdata=A("127.0.0.1"))
        )
        return reply

    qname = str(request.q.qname).rstrip(".").lower()
    if qname.endswith(self.domain):
        # ADVANCED: Extract ALL subdomains to the left of your base domain
        prefix = qname[: -(len(self.domain) + 1)]
        payload_label = prefix.replace(".", "").upper()  # Rebuild unified Base32 string

        # Pad Base-32 to 8-char boundary
        pad_len = (-len(payload_label)) % 8
        payload_label += "=" * pad_len

        try:
            raw = base64.b32decode(payload_label)
        except Exception as exc:
            print(f"[ERROR] Base-32 decode failed: {exc}")
            self._record_failure(src_ip)
        else:
            if len(raw) < 16:
                print("[ERROR] Payload too short for session ID")
                self._record_failure(src_ip)
            else:
                session_id = raw[:16]
                ciphertext = raw[16:]
                try:
                    plaintext = self.crypto.decrypt(ciphertext, session_id)

                    # ADVANCED: Parse the 4-byte custom Reliability Header
                    # Format: !HBB -> Unsigned Short (Seq), Unsigned Char (IsLast), Unsigned Char (Len)
                    seq_num, is_last, data_len = struct.unpack(
                        "!HBB", plaintext[:4]
                    )
                    actual_chunk_data = plaintext[4 : 4 + data_len]

                    # Cache chunk in session memory
                    session_key = session_id.hex()
                    if session_key not in self.session_buffers:
                        self.session_buffers[session_key] = {
                            "chunks": {},
                            "total_expected": None,
                        }

                    self.session_buffers[session_key]["chunks"][seq_num] = (
                        actual_chunk_data
                    )

                    if is_last == 1:
                        self.session_buffers[session_key]["total_expected"] = (
                            seq_num + 1
                        )

                    # Check if stream is fully ready for reassembly
                    session_meta = self.session_buffers[session_key]
                    if (
                        session_meta["total_expected"] is not None
                        and len(session_meta["chunks"])
                        == session_meta["total_expected"]
                    ):
                        # Reassemble stream in precise sequential order
                        full_payload = b"".join(
                            session_meta["chunks"][i]
                            for i in range(session_meta["total_expected"])
                        )

                        # Fire structured entry to async logger thread
                        entry = {
                            "ts": time.time(),
                            "src_ip": src_ip,
                            "query": qname,
                            "session_id": session_key,
                            "payload": payload_label,
                            "plaintext": full_payload.decode(
                                "utf-8", "replace"
                            ),
                        }
                        self.logger.log(entry)
                        print(
                            f"\n[+] SUCCESS: Fully reassembled session {session_key[:8]}..."
                        )
                        print(f"[DATA] {full_payload!r}")

                        # Clean up cache memory
                        del self.session_buffers[session_key]

                except Exception as exc:
                    print(f"[DECRYPT/REASSEMBLY ERROR] {exc}")
                    self._record_failure(src_ip)

    reply.add_answer(RR(request.q.qname, QTYPE.A, ttl=1, rdata=A("8.8.8.8")))
    return reply