#!/usr/bin/env python3
"""
Security Toolkit — file-manipulation utilities for authorized security testing
(CTFs, labs you own, and engagements where you have explicit written permission).

Each class below is self-contained; import just what you need:

    from security_toolkit import LogAnalyzer, HashCracker, MetadataExtractor, ...

Modules included:
  1. LogAnalyzer        - parse/filter auth & app logs for suspicious events
  2. PcapOrganizer       - sort/filter pcap files by basic criteria (needs scapy)
  3. HashCracker         - dictionary-crack hashes from a file against a wordlist
  4. MetadataExtractor   - pull EXIF/file metadata for OSINT (needs Pillow)
  5. FileCarver          - carve embedded files out of a blob by magic bytes
  6. ConfigAuditor       - flag common misconfigurations in config files
  7. ReportGenerator     - compile findings (JSON/dict) into a Markdown report
  8. WordlistTool        - generate/mutate/dedupe wordlists
  9. CertAnalyzer        - parse X.509 certs from PEM/DER files
  10. FileTimeline        - build a forensic timeline from filesystem metadata

No exploitation, payload delivery, or live-target scanning code is included —
this is strictly local file/data analysis tooling.
"""

import os
import re
import json
import hashlib
import struct
import itertools
from pathlib import Path
from datetime import datetime


# ───────────────────────────── 1. LOG ANALYZER ─────────────────────────────

class LogAnalyzer:
    """Parse and flag suspicious lines in auth/app logs."""

    PATTERNS = {
        "failed_login": re.compile(r"(failed password|authentication failure|invalid user)", re.I),
        "success_login": re.compile(r"(accepted password|session opened|successful login)", re.I),
        "sudo_use": re.compile(r"\bsudo\b", re.I),
        "sql_injection": re.compile(r"(union select|or 1=1|' or '|--\s*$|drop table)", re.I),
        "path_traversal": re.compile(r"(\.\./|\.\.\\|%2e%2e%2f)", re.I),
        "xss_attempt": re.compile(r"(<script|javascript:|onerror=)", re.I),
    }

    def __init__(self, log_path):
        self.log_path = Path(log_path)

    def scan(self):
        """Return {category: [(lineno, line), ...]} for every pattern match."""
        if not self.log_path.exists():
            raise FileNotFoundError(self.log_path)
        results = {k: [] for k in self.PATTERNS}
        with open(self.log_path, "r", errors="ignore") as f:
            for i, line in enumerate(f, 1):
                for name, pattern in self.PATTERNS.items():
                    if pattern.search(line):
                        results[name].append((i, line.strip()))
        return results

    def failed_login_sources(self):
        """Extract IPs associated with failed logins, with counts (brute-force hunting)."""
        ip_re = re.compile(r"\b(?:\d{1,3}\.){3}\d{1,3}\b")
        counts = {}
        with open(self.log_path, "r", errors="ignore") as f:
            for line in f:
                if self.PATTERNS["failed_login"].search(line):
                    for ip in ip_re.findall(line):
                        counts[ip] = counts.get(ip, 0) + 1
        return dict(sorted(counts.items(), key=lambda x: -x[1]))

    def summary(self):
        results = self.scan()
        print(f"\n=== Log Analysis: {self.log_path.name} ===")
        for category, hits in results.items():
            print(f"{category}: {len(hits)} match(es)")
        top_ips = self.failed_login_sources()
        if top_ips:
            print("\nTop failed-login sources:")
            for ip, count in list(top_ips.items())[:10]:
                print(f"  {ip}: {count} attempt(s)")
        return results


# ───────────────────────────── 2. PCAP ORGANIZER ─────────────────────────────

class PcapOrganizer:
    """
    Basic pcap triage without requiring scapy — reads global header +
    packet headers directly. For deep protocol parsing, use scapy/pyshark
    if installed.
    """

    def __init__(self, pcap_path):
        self.pcap_path = Path(pcap_path)

    def basic_info(self):
        """Read the pcap global header and count packets/bytes."""
        if not self.pcap_path.exists():
            raise FileNotFoundError(self.pcap_path)

        with open(self.pcap_path, "rb") as f:
            magic = f.read(4)
            if magic == b"\xd4\xc3\xb2\xa1":
                endian = "<"
            elif magic == b"\xa1\xb2\xc3\xd4":
                endian = ">"
            else:
                raise ValueError("Not a classic pcap file (magic mismatch)")

            header = f.read(20)
            version_major, version_minor, tz, sigfigs, snaplen, linktype = struct.unpack(
                endian + "HHiIII", header
            )

            packet_count = 0
            total_bytes = 0
            first_ts = last_ts = None

            while True:
                ph = f.read(16)
                if len(ph) < 16:
                    break
                ts_sec, ts_usec, incl_len, orig_len = struct.unpack(endian + "IIII", ph)
                f.seek(incl_len, 1)
                packet_count += 1
                total_bytes += orig_len
                ts = ts_sec + ts_usec / 1e6
                first_ts = ts if first_ts is None else first_ts
                last_ts = ts

        return {
            "linktype": linktype,
            "packet_count": packet_count,
            "total_bytes": total_bytes,
            "duration_seconds": (last_ts - first_ts) if first_ts else 0,
            "start_time": datetime.fromtimestamp(first_ts).isoformat() if first_ts else None,
        }

    def split_by_size(self, out_dir, max_packets=1000):
        """Split a large pcap into N-packet chunks (same global header each)."""
        out_dir = Path(out_dir)
        out_dir.mkdir(parents=True, exist_ok=True)

        with open(self.pcap_path, "rb") as f:
            global_header = f.read(24)
            chunk_idx, count = 0, 0
            out_f = open(out_dir / f"{self.pcap_path.stem}_part{chunk_idx:03d}.pcap", "wb")
            out_f.write(global_header)

            while True:
                ph = f.read(16)
                if len(ph) < 16:
                    break
                incl_len = struct.unpack("<I", ph[8:12])[0]
                packet_data = f.read(incl_len)

                out_f.write(ph)
                out_f.write(packet_data)
                count += 1

                if count >= max_packets:
                    out_f.close()
                    chunk_idx += 1
                    count = 0
                    out_f = open(out_dir / f"{self.pcap_path.stem}_part{chunk_idx:03d}.pcap", "wb")
                    out_f.write(global_header)
            out_f.close()
        print(f"✓ Split into {chunk_idx + 1} chunk(s) in {out_dir}")


# ───────────────────────────── 3. HASH CRACKER ─────────────────────────────

class HashCracker:
    """
    Dictionary attack against hashes you are authorized to test
    (e.g., your own password hashes, a CTF challenge file).
    """

    ALGOS = {32: "md5", 40: "sha1", 64: "sha256", 128: "sha512"}

    def __init__(self, wordlist_path=None):
        self.wordlist_path = Path(wordlist_path) if wordlist_path else None

    def _guess_algo(self, h):
        return self.ALGOS.get(len(h.strip()))

    def crack_hash(self, target_hash, algo=None, wordlist_path=None):
        """Try every word in the wordlist against a single hash."""
        wl = Path(wordlist_path or self.wordlist_path)
        algo = algo or self._guess_algo(target_hash)
        if not algo:
            raise ValueError("Could not infer algorithm; pass algo='md5'/'sha1'/'sha256'/'sha512'")

        target_hash = target_hash.strip().lower()
        with open(wl, "r", errors="ignore") as f:
            for word in f:
                word = word.rstrip("\n")
                h = hashlib.new(algo, word.encode()).hexdigest()
                if h == target_hash:
                    return word
        return None

    def crack_file(self, hash_file, algo=None, wordlist_path=None):
        """Crack every hash in a file (one per line); returns {hash: plaintext|None}."""
        results = {}
        with open(hash_file, "r", errors="ignore") as f:
            hashes = [line.strip() for line in f if line.strip()]

        wl = Path(wordlist_path or self.wordlist_path)
        # Build algo groups so we only pass over the wordlist once per algo
        by_algo = {}
        for h in hashes:
            a = algo or self._guess_algo(h)
            by_algo.setdefault(a, []).append(h)

        for a, hlist in by_algo.items():
            remaining = {h: None for h in hlist}
            with open(wl, "r", errors="ignore") as f:
                for word in f:
                    if not remaining:
                        break
                    word = word.rstrip("\n")
                    digest = hashlib.new(a, word.encode()).hexdigest()
                    if digest in remaining and remaining[digest] is None:
                        remaining[digest] = word
            results.update(remaining)

        for h, pw in results.items():
            status = f"FOUND: {pw}" if pw else "not found"
            print(f"{h[:16]}... [{status}]")
        return results

    @staticmethod
    def hash_string(text, algo="sha256"):
        return hashlib.new(algo, text.encode()).hexdigest()


# ───────────────────────────── 4. METADATA EXTRACTOR ─────────────────────────────

class MetadataExtractor:
    """Pull filesystem + (optionally) EXIF metadata from files for OSINT work."""

    def __init__(self, base_path="."):
        self.base_path = Path(base_path)

    def fs_metadata(self, filename):
        p = self.base_path / filename
        if not p.exists():
            raise FileNotFoundError(p)
        stat = p.stat()
        return {
            "name": p.name,
            "size_bytes": stat.st_size,
            "created": datetime.fromtimestamp(stat.st_ctime).isoformat(),
            "modified": datetime.fromtimestamp(stat.st_mtime).isoformat(),
            "accessed": datetime.fromtimestamp(stat.st_atime).isoformat(),
        }

    def exif_metadata(self, filename):
        """Requires Pillow: pip install Pillow"""
        try:
            from PIL import Image
            from PIL.ExifTags import TAGS
        except ImportError:
            return {"error": "Pillow not installed (pip install Pillow)"}

        p = self.base_path / filename
        img = Image.open(p)
        exif_data = img.getexif()
        if not exif_data:
            return {}

        readable = {}
        for tag_id, value in exif_data.items():
            tag = TAGS.get(tag_id, tag_id)
            readable[tag] = str(value)

        gps_info = {}
        if "GPSInfo" in readable or 0x8825 in exif_data:
            try:
                gps_raw = exif_data.get_ifd(0x8825)
                from PIL.ExifTags import GPSTAGS
                for k, v in gps_raw.items():
                    gps_info[GPSTAGS.get(k, k)] = v
            except Exception:
                pass
        if gps_info:
            readable["GPS"] = gps_info

        return readable

    def strings_scan(self, filename, min_length=4):
        """Extract printable ASCII strings from any file (like the `strings` CLI tool)."""
        p = self.base_path / filename
        pattern = re.compile(rb"[\x20-\x7e]{%d,}" % min_length)
        data = p.read_bytes()
        return [s.decode() for s in pattern.findall(data)]


# ───────────────────────────── 5. FILE CARVER ─────────────────────────────

class FileCarver:
    """Recover/extract embedded files from a blob using magic-byte signatures."""

    SIGNATURES = {
        "jpg": (b"\xff\xd8\xff", b"\xff\xd9"),
        "png": (b"\x89PNG\r\n\x1a\n", b"IEND\xaeB`\x82"),
        "gif": (b"GIF8", b"\x00\x3b"),
        "pdf": (b"%PDF", b"%%EOF"),
        "zip": (b"PK\x03\x04", None),
        "gzip": (b"\x1f\x8b", None),
    }

    def __init__(self, source_file):
        self.source_file = Path(source_file)

    def carve(self, out_dir, file_types=None):
        out_dir = Path(out_dir)
        out_dir.mkdir(parents=True, exist_ok=True)
        data = self.source_file.read_bytes()

        types = file_types or list(self.SIGNATURES.keys())
        found = []
        for ftype in types:
            header, footer = self.SIGNATURES[ftype]
            start = 0
            idx = 0
            while True:
                start = data.find(header, start)
                if start == -1:
                    break
                if footer:
                    end = data.find(footer, start)
                    end = end + len(footer) if end != -1 else start + 1_000_000
                else:
                    end = start + 1_000_000  # no footer sig known; cap size
                chunk = data[start:end]
                out_path = out_dir / f"carved_{ftype}_{idx:03d}.{ftype}"
                out_path.write_bytes(chunk)
                found.append(str(out_path))
                idx += 1
                start = end

        print(f"✓ Carved {len(found)} file(s) into {out_dir}")
        return found


# ───────────────────────────── 6. CONFIG AUDITOR ─────────────────────────────

class ConfigAuditor:
    """Flag common security misconfigurations in text-based config files."""

    RULES = [
        (re.compile(r"PermitRootLogin\s+yes", re.I), "SSH root login is enabled"),
        (re.compile(r"PasswordAuthentication\s+yes", re.I), "SSH password auth enabled (prefer keys)"),
        (re.compile(r"(password|passwd|secret|api[_-]?key)\s*[:=]\s*['\"]?[\w\-]{4,}", re.I),
         "Possible hardcoded credential/secret"),
        (re.compile(r"debug\s*=\s*true", re.I), "Debug mode enabled"),
        (re.compile(r"0\.0\.0\.0", re.I), "Service bound to all interfaces"),
        (re.compile(r"allow[_-]?origin[:\s]*\*", re.I), "Wildcard CORS origin"),
        (re.compile(r"ssl[_-]?verify\s*[:=]\s*(false|0|none)", re.I), "SSL/TLS verification disabled"),
        (re.compile(r"X-Powered-By", re.I), "Version-disclosing header present"),
    ]

    def __init__(self, config_path):
        self.config_path = Path(config_path)

    def audit(self):
        findings = []
        with open(self.config_path, "r", errors="ignore") as f:
            for lineno, line in enumerate(f, 1):
                for pattern, description in self.RULES:
                    if pattern.search(line):
                        findings.append({
                            "line": lineno,
                            "issue": description,
                            "content": line.strip()[:120],
                        })
        return findings

    def print_report(self):
        findings = self.audit()
        print(f"\n=== Config Audit: {self.config_path.name} ===")
        if not findings:
            print("No issues flagged by current ruleset.")
        for f in findings:
            print(f"  [line {f['line']}] {f['issue']}")
            print(f"    → {f['content']}")
        return findings


# ───────────────────────────── 7. REPORT GENERATOR ─────────────────────────────

class ReportGenerator:
    """Compile structured findings into a Markdown pentest/CTF report."""

    SEVERITY_ORDER = {"critical": 0, "high": 1, "medium": 2, "low": 3, "info": 4}

    def __init__(self, title="Security Assessment Report", author=""):
        self.title = title
        self.author = author
        self.findings = []

    def add_finding(self, title, severity, description, evidence="", remediation=""):
        self.findings.append({
            "title": title,
            "severity": severity.lower(),
            "description": description,
            "evidence": evidence,
            "remediation": remediation,
        })

    def add_findings_from_json(self, json_path):
        """Load findings from a JSON file: a list of dicts matching add_finding's fields."""
        with open(json_path) as f:
            data = json.load(f)
        for item in data:
            self.add_finding(**item)

    def generate_markdown(self, out_path="report.md"):
        self.findings.sort(key=lambda x: self.SEVERITY_ORDER.get(x["severity"], 99))

        lines = [f"# {self.title}", ""]
        if self.author:
            lines.append(f"**Prepared by:** {self.author}  ")
        lines.append(f"**Date:** {datetime.now().strftime('%Y-%m-%d')}")
        lines.append("")
        lines.append("## Executive Summary")
        lines.append(f"Total findings: {len(self.findings)}")
        for sev in self.SEVERITY_ORDER:
            count = sum(1 for f in self.findings if f["severity"] == sev)
            if count:
                lines.append(f"- **{sev.capitalize()}**: {count}")
        lines.append("")
        lines.append("## Findings")
        for i, f in enumerate(self.findings, 1):
            lines.append(f"### {i}. {f['title']} — `{f['severity'].upper()}`")
            lines.append(f"**Description:** {f['description']}")
            if f["evidence"]:
                lines.append(f"\n**Evidence:**\n```\n{f['evidence']}\n```")
            if f["remediation"]:
                lines.append(f"\n**Remediation:** {f['remediation']}")
            lines.append("")

        Path(out_path).write_text("\n".join(lines), encoding="utf-8")
        print(f"✓ Report written to {out_path}")
        return out_path


# ───────────────────────────── 8. WORDLIST TOOL ─────────────────────────────

class WordlistTool:
    """Generate, mutate, and clean wordlists for authorized password testing."""

    LEET_MAP = {"a": "4", "e": "3", "i": "1", "o": "0", "s": "5", "t": "7"}

    @staticmethod
    def dedupe(in_path, out_path):
        seen = set()
        with open(in_path, errors="ignore") as f:
            words = [w.rstrip("\n") for w in f]
        unique = []
        for w in words:
            if w not in seen:
                seen.add(w)
                unique.append(w)
        Path(out_path).write_text("\n".join(unique), encoding="utf-8")
        print(f"✓ {len(words)} → {len(unique)} unique words → {out_path}")
        return len(unique)

    @classmethod
    def leetspeak_variants(cls, word):
        """Generate common leetspeak substitutions for a single word."""
        variants = {word}
        chars = list(word.lower())
        swappable = [i for i, c in enumerate(chars) if c in cls.LEET_MAP]

        for r in range(1, len(swappable) + 1):
            for combo in itertools.combinations(swappable, r):
                new_chars = chars.copy()
                for i in combo:
                    new_chars[i] = cls.LEET_MAP[new_chars[i]]
                variants.add("".join(new_chars))
        return variants

    @classmethod
    def mutate_wordlist(cls, in_path, out_path, add_years=True, add_leet=True, add_suffixes=True):
        """Expand a base wordlist with common human password patterns."""
        suffixes = ["", "!", "123", "1", "2023", "2024", "2025", "2026"] if add_suffixes else [""]
        years = [str(y) for y in range(2015, 2027)] if add_years else []

        with open(in_path, errors="ignore") as f:
            base_words = [w.strip() for w in f if w.strip()]

        out_words = set()
        for word in base_words:
            candidates = cls.leetspeak_variants(word) if add_leet else {word}
            for c in candidates:
                for suf in suffixes:
                    out_words.add(c + suf)
                for y in years:
                    out_words.add(c + y)
                    out_words.add(word.capitalize() + y)

        Path(out_path).write_text("\n".join(sorted(out_words)), encoding="utf-8")
        print(f"✓ Generated {len(out_words)} variants → {out_path}")
        return len(out_words)

    @staticmethod
    def from_wordlist_combo(words, out_path, separator=""):
        """Combine a small list of words pairwise (e.g. company+year style passwords)."""
        combos = {f"{a}{separator}{b}" for a in words for b in words if a != b}
        Path(out_path).write_text("\n".join(sorted(combos)), encoding="utf-8")
        print(f"✓ {len(combos)} combinations → {out_path}")
        return len(combos)


# ───────────────────────────── 9. CERT ANALYZER ─────────────────────────────

class CertAnalyzer:
    """Parse X.509 certificates from local PEM/DER files. Requires `cryptography`."""

    def __init__(self):
        try:
            from cryptography import x509
            from cryptography.hazmat.backends import default_backend
            self._x509 = x509
            self._backend = default_backend()
        except ImportError:
            self._x509 = None

    def analyze(self, cert_path):
        if not self._x509:
            return {"error": "cryptography package not installed (pip install cryptography)"}

        data = Path(cert_path).read_bytes()
        try:
            cert = self._x509.load_pem_x509_certificate(data, self._backend)
        except ValueError:
            cert = self._x509.load_der_x509_certificate(data, self._backend)

        now = datetime.utcnow()
        not_after = cert.not_valid_after_utc.replace(tzinfo=None) if hasattr(cert, "not_valid_after_utc") else cert.not_valid_after

        info = {
            "subject": cert.subject.rfc4514_string(),
            "issuer": cert.issuer.rfc4514_string(),
            "serial_number": str(cert.serial_number),
            "not_valid_before": str(cert.not_valid_before_utc if hasattr(cert, "not_valid_before_utc") else cert.not_valid_before),
            "not_valid_after": str(not_after),
            "is_expired": now > not_after,
            "signature_algorithm": cert.signature_algorithm_oid._name,
        }

        try:
            san = cert.extensions.get_extension_for_class(self._x509.SubjectAlternativeName)
            info["subject_alt_names"] = san.value.get_values_for_type(self._x509.DNSName)
        except Exception:
            info["subject_alt_names"] = []

        return info

    def print_report(self, cert_path):
        info = self.analyze(cert_path)
        print(f"\n=== Certificate: {cert_path} ===")
        for k, v in info.items():
            print(f"{k}: {v}")
        return info


# ───────────────────────────── 10. FILE TIMELINE ─────────────────────────────

class FileTimeline:
    """Build a chronological forensic timeline from filesystem metadata."""

    def __init__(self, base_path="."):
        self.base_path = Path(base_path)

    def build(self, pattern="**/*", include_hash=False):
        events = []
        for p in self.base_path.glob(pattern):
            if not p.is_file():
                continue
            try:
                stat = p.stat()
            except (PermissionError, FileNotFoundError):
                continue

            entry = {
                "path": str(p.relative_to(self.base_path)),
                "created": stat.st_ctime,
                "modified": stat.st_mtime,
                "accessed": stat.st_atime,
                "size": stat.st_size,
            }
            if include_hash:
                try:
                    entry["sha256"] = hashlib.sha256(p.read_bytes()).hexdigest()
                except Exception:
                    entry["sha256"] = None
            events.append(entry)

        timeline = []
        for e in events:
            for action, ts_key in (("created", "created"), ("modified", "modified"), ("accessed", "accessed")):
                timeline.append({
                    "timestamp": e[ts_key],
                    "time_readable": datetime.fromtimestamp(e[ts_key]).isoformat(),
                    "action": action,
                    "path": e["path"],
                    "size": e["size"],
                    **({"sha256": e.get("sha256")} if include_hash else {}),
                })

        timeline.sort(key=lambda x: x["timestamp"])
        return timeline

    def export_csv(self, out_path, pattern="**/*", include_hash=False):
        import csv
        timeline = self.build(pattern, include_hash)
        if not timeline:
            print("No files found to timeline.")
            return out_path

        fieldnames = list(timeline[0].keys())
        with open(out_path, "w", newline="") as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(timeline)
        print(f"✓ Timeline with {len(timeline)} events → {out_path}")
        return out_path

    def print_summary(self, pattern="**/*"):
        timeline = self.build(pattern)
        print(f"\n=== File Timeline ({len(timeline)} events) ===")
        for e in timeline[:30]:
            print(f"  {e['time_readable']}  [{e['action']:<9}] {e['path']}")
        if len(timeline) > 30:
            print(f"  ... and {len(timeline) - 30} more (use export_csv for full output)")
        return timeline


# ───────────────────────────── DEMO ─────────────────────────────

if __name__ == "__main__":
    print(__doc__)
    print("Import the classes you need, e.g.:")
    print("  from security_toolkit import LogAnalyzer")
    print("  LogAnalyzer('/var/log/auth.log').summary()")
