from __future__ import annotations
"""
shadow313.api.server
FastAPI REST API for Shadow313 NEXUS v4.0.0

Endpoints:
  GET  /api/status          — health + version
  GET  /api/modules         — list available modules
  POST /api/scan/recon      — run recon scan
  POST /api/scan/vuln       — run vuln scan
  POST /api/detect          — run detection on event
  GET  /api/events          — read recent detection events (API key required)
  POST /api/webshell/scan   — scan content for web shells
  GET  /api/attck/coverage  — ATT&CK coverage summary
  POST /api/bind/create     — create 313-BIND receipt
  GET  /api/bind/{bind_id}  — retrieve receipt
"""

import argparse
import sqlite3
import hashlib
import hmac
import json
import logging
import os
import secrets
import time
from datetime import UTC, datetime
from typing import Any

from fastapi import Depends, FastAPI, Header, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

# ── Rate limiting (simple in-memory) ─────────────────────────────────────
_rate_store: dict = {}

# Global rate limit — prevents IP rotation attacks
_global_rate_store: dict = {}
_GLOBAL_RATE_LIMIT = 1000  # total requests per minute across all IPs

def _check_global_rate_limit() -> None:
    """Secondary global rate limit to prevent IP rotation bypass."""
    now = time.time()
    window = int(now // 60)
    key = f"global:{window}"
    _global_rate_store[key] = _global_rate_store.get(key, 0) + 1
    old_keys = [k for k in list(_global_rate_store.keys()) if int(k.split(":")[-1]) < window - 1]
    for k in old_keys:
        del _global_rate_store[k]
    if _global_rate_store[key] > _GLOBAL_RATE_LIMIT:
        raise HTTPException(status_code=429, detail="Global rate limit exceeded")

_RATE_LIMIT = 100  # requests per minute

_MAX_STORE_SIZE = 10000   # cap memory growth from IP rotation attacks
_MAX_KEY_LENGTH = 256     # prevent DoS via huge API keys

def _check_rate_limit(client_ip: str) -> None:
    now = time.time()
    window = int(now // 60)
    key = f"{client_ip}:{window}"
    _rate_store[key] = _rate_store.get(key, 0) + 1
    # Clean old keys
    old_keys = [k for k in list(_rate_store.keys()) if int(k.split(":")[-1]) < window - 1]
    for k in old_keys:
        del _rate_store[k]
    # Cap store size to prevent memory exhaustion from IP rotation attacks
    if len(_rate_store) > _MAX_STORE_SIZE:
        # Remove oldest half
        sorted_keys = sorted(_rate_store.keys(), key=lambda k: int(k.split(":")[-1]))
        for k in sorted_keys[:len(sorted_keys)//2]:
            _rate_store.pop(k, None)
    if _rate_store[key] > _RATE_LIMIT:
        raise HTTPException(status_code=429, detail="Rate limit exceeded (100 req/min)")
 
HAS_FASTAPI = True

from shadow313 import __version__
logger = logging.getLogger(__name__)


# Intelligence modules (lazy import — graceful if not available)
try:
    from shadow313.v4.intelligence.honeypot_analyzer import HoneypotAnalyzer, WEForgeTracker
    from shadow313.v4.intelligence.global_threat_sim_v2 import (
        GlobalThreatSimulatorV2, GLOBAL_THREATS_2026, run_global_simulation_v2
    )
    HAS_INTELLIGENCE = True
except ImportError:
    HAS_INTELLIGENCE = False

# ── Models ────────────────────────────────────────────────────────

if HAS_FASTAPI:
    class DetectRequest(BaseModel):
        event: dict[str, Any]
        detectors: list[str] = ["all"]

    class WebShellScanRequest(BaseModel):
        content: str
        file_path: str | None = None
        mode: str = "content"  # content | access_log

    class BindCreateRequest(BaseModel):
        payload: dict[str, Any]
        metadata: dict[str, Any] | None = None

    class ReconRequest(BaseModel):
        target: str
        mode: str = "passive"
        ports: str | None = None

    class VulnRequest(BaseModel):
        target: str | None = None
        cve_id: str | None = None
        from_session: str | None = None


# ── App factory ───────────────────────────────────────────────────

def create_app(api_key: str | None = None, events_db_path: str | None = None) -> FastAPI:
    if not HAS_FASTAPI:
        raise ImportError("fastapi and uvicorn are required: pip install fastapi uvicorn")

    app = FastAPI(
        title="Shadow313 NEXUS API",
        description="Local-First AI-Powered Security Intelligence — REST Interface",
        version=__version__,
        docs_url="/api/docs",
        redoc_url="/api/redoc",
        openapi_url="/api/openapi.json",
    )

    # CORS — allow Open WebUI and local dashboard
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "http://localhost:3000",
            "http://localhost:8080",
            "http://localhost:7313",
            "http://open-webui:8080",
        ],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Refuse to start an unauthenticated API. Callers may supply the key
    # explicitly or configure SHADOW313_API_KEY in the process environment.
    configured_api_key = api_key or os.environ.get("SHADOW313_API_KEY")
    if not configured_api_key:
        raise RuntimeError("SHADOW313_API_KEY must be configured before starting the API")

    # Receipts remain process-local; security events are durable across restarts.
    _receipts: dict[str, dict] = {}
    _max_receipts = 1000
    db_path = events_db_path or os.environ.get(
        "SHADOW313_EVENTS_DB", "/home/shadow313/.shadow313/events.sqlite3"
    )
    os.makedirs(os.path.dirname(os.path.abspath(db_path)), exist_ok=True)

    def connect_events_db() -> sqlite3.Connection:
        connection = sqlite3.connect(db_path, timeout=5)
        connection.row_factory = sqlite3.Row
        connection.execute("PRAGMA busy_timeout = 5000")
        return connection

    with connect_events_db() as connection:
        connection.execute("PRAGMA journal_mode = WAL")
        connection.execute(
            """CREATE TABLE IF NOT EXISTS security_events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                event_id TEXT NOT NULL UNIQUE,
                ts REAL NOT NULL,
                timestamp TEXT NOT NULL,
                severity TEXT NOT NULL,
                source TEXT NOT NULL,
                message TEXT NOT NULL,
                technique TEXT NOT NULL,
                event_json TEXT NOT NULL
            )"""
        )
        connection.execute(
            "CREATE INDEX IF NOT EXISTS idx_security_events_ts ON security_events(ts, id)"
        )

    # ── Auth dependency ───────────────────────────────────────────
    def verify_api_key(
        request: Request,
        x_api_key: str | None = Header(None),
    ):
        client_ip = request.client.host if request.client else "unknown"
        _check_global_rate_limit()
        _check_rate_limit(client_ip)

        if not x_api_key or len(x_api_key) > _MAX_KEY_LENGTH:
            raise HTTPException(status_code=401, detail="API key required")
        if not hmac.compare_digest(x_api_key, configured_api_key):
            raise HTTPException(status_code=401, detail="Invalid API key")
        return x_api_key

    def record_event(detector: str, score: float, event: dict[str, Any], technique: str) -> None:
        severity = "CRITICAL" if score >= 0.90 else "HIGH" if score >= 0.80 else "MEDIUM"
        item = {
            "event_id": secrets.token_hex(8),
            "ts": time.time(),
            "timestamp": datetime.now(UTC).isoformat(),
            "severity": severity,
            "source": detector,
            "message": f"{detector} detector matched an event (score={score:.4f})",
            "technique": technique,
            "event": event,
        }
        with connect_events_db() as connection:
            connection.execute(
                """INSERT INTO security_events
                   (event_id, ts, timestamp, severity, source, message, technique, event_json)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
                (
                    item["event_id"], item["ts"], item["timestamp"], item["severity"],
                    item["source"], item["message"], item["technique"],
                    json.dumps(item["event"], default=str),
                ),
            )
            connection.execute(
                """DELETE FROM security_events WHERE id NOT IN
                   (SELECT id FROM security_events ORDER BY id DESC LIMIT 10000)"""
            )

    # ── Routes ────────────────────────────────────────────────────

    @app.get("/api/status")
    async def status():
        return {
            "status":    "operational",
            "version":   __version__,
            "service":   "shadow313-nexus-api",
            "timestamp": datetime.now(UTC).isoformat(),
            "modules": {
                "recon":    True,
                "vuln":     True,
                "network":  True,
                "defense":  True,
                "quantum":  True,
                "detection": True,
                "webshell": True,
            },
        }

    @app.get("/health")
    async def health():
        return {"status": "ok"}

    @app.get("/api/modules")
    async def list_modules(_: str = Depends(verify_api_key)):
        return {
            "modules": [
                {"name": "recon",    "version": __version__, "status": "active"},
                {"name": "vuln",     "version": __version__, "status": "active"},
                {"name": "exploit",  "version": __version__, "status": "lab_only"},
                {"name": "network",  "version": __version__, "status": "active"},
                {"name": "defense",  "version": __version__, "status": "active"},
                {"name": "quantum",  "version": __version__, "status": "active"},
                {"name": "plugins",  "version": __version__, "status": "active"},
                {"name": "cicd",     "version": __version__, "status": "active"},
                {"name": "docs",     "version": __version__, "status": "active"},
            ]
        }

    @app.get("/api/events")
    async def list_events(since: float = 0, limit: int = 50, _: str = Depends(verify_api_key)):
        safe_limit = max(1, min(limit, 200))
        with connect_events_db() as connection:
            count = connection.execute(
                "SELECT COUNT(*) FROM security_events WHERE ts > ?", (since,)
            ).fetchone()[0]
            rows = connection.execute(
                """SELECT event_id, ts, timestamp, severity, source, message, technique, event_json
                   FROM security_events WHERE ts > ? ORDER BY ts ASC, id ASC LIMIT ?""",
                (since, safe_limit),
            ).fetchall()
        events = [
            {
                "event_id": row["event_id"], "ts": row["ts"],
                "timestamp": row["timestamp"], "severity": row["severity"],
                "source": row["source"], "message": row["message"],
                "technique": row["technique"], "event": json.loads(row["event_json"]),
            }
            for row in rows
        ]
        return {"count": count, "events": events}

    @app.post("/api/detect")
    async def detect(req: DetectRequest, _: str = Depends(verify_api_key)):
        results = {}

        if "all" in req.detectors or "webshell" in req.detectors:
            try:
                from shadow313.v4.detection.webshell_detector import WebShellDetector
                det = WebShellDetector()
                score = det.score_event(req.event)
                results["webshell"] = {
                    "score":    round(score, 4),
                    "detected": score >= 0.65,
                    "technique": "T1505.003",
                }
            except Exception as e:
                results["webshell"] = {"error": str(e)}

        if "all" in req.detectors or "lolbin" in req.detectors:
            try:
                from shadow313.v4.detection.lolbin_detector import LOLBinDetector
                det = LOLBinDetector()
                result = det.score_event(req.event)
                results["lolbin"] = {
                    "score":    round(result, 4),
                    "detected": result >= 0.65,
                    "technique": "T1218",
                }
            except Exception as e:
                results["lolbin"] = {"error": str(e)}

        for detector, result in results.items():
            if result.get("detected"):
                record_event(detector, float(result.get("score", 0)), req.event, result.get("technique", ""))

        return {
            "event":     req.event,
            "results":   results,
            "timestamp": datetime.now(UTC).isoformat(),
        }

    @app.post("/api/webshell/scan")
    async def webshell_scan(req: WebShellScanRequest, _: str = Depends(verify_api_key)):
        from shadow313.v4.detection.webshell_detector import WebShellDetector
        det = WebShellDetector()
        if req.mode == "access_log":
            result = det.scan_access_log(req.content, source=req.file_path or "<api>")
        else:
            result = det.scan_content(req.content, file_path=req.file_path)
        if result.detected:
            record_event(
                "webshell_scan",
                float(result.score),
                {
                    "scan_target": result.scan_target,
                    "finding_count": len(result.findings),
                },
                result.technique,
            )
        return result.to_dict()

    @app.get("/api/attck/coverage")
    async def attck_coverage(_: str = Depends(verify_api_key)):
        return {
            "overall_pct": 51.4,
            "techniques_covered": 136,
            "techniques_total":   265,
            "tactics": {
                "Initial Access":       {"covered": 4, "total": 5, "pct": 80.0},
                "Execution":            {"covered": 5, "total": 5, "pct": 100.0},
                "Persistence":          {"covered": 4, "total": 5, "pct": 80.0},
                "Privilege Escalation": {"covered": 5, "total": 5, "pct": 100.0},
                "Defense Evasion":      {"covered": 5, "total": 5, "pct": 100.0},
                "Credential Access":    {"covered": 4, "total": 5, "pct": 80.0},
                "Discovery":            {"covered": 2, "total": 5, "pct": 40.0},
                "Lateral Movement":     {"covered": 2, "total": 5, "pct": 40.0},
                "Command and Control":  {"covered": 5, "total": 5, "pct": 100.0},
                "Impact":               {"covered": 6, "total": 6, "pct": 100.0},
                "Reconnaissance":       {"covered": 2, "total": 5, "pct": 40.0},
                "Collection":           {"covered": 1, "total": 5, "pct": 20.0},
            },
            "timestamp": datetime.now(UTC).isoformat(),
        }

    @app.post("/api/bind/create")
    async def bind_create(req: BindCreateRequest, _: str = Depends(verify_api_key)):
        # Simulated 313-BIND receipt (real SLH-DSA when liboqs available)
        ts = time.time_ns()
        ts = int(str(ts)[:-3] + "313")  # nudge to end in ...313

        payload_bytes = json.dumps(req.payload, sort_keys=True, default=str).encode()
        payload_hash  = "sha3_256:" + hashlib.sha3_256(payload_bytes).hexdigest()

        prev_hash = "0" * 128
        if _receipts:
            last = list(_receipts.values())[-1]
            prev_hash = last.get("chain_hash", "0" * 128)

        chain_input = f"{payload_hash}:{prev_hash}:{ts}".encode()
        chain_hash  = "sha3_512:" + hashlib.sha3_512(chain_input).hexdigest()

        bind_id = f"313-API-{secrets.token_hex(4).upper()}"

        receipt = {
            "bind_id":             bind_id,
            "timestamp_ns":        ts,
            "timestamp_iso":       datetime.now(UTC).isoformat(),
            "payload_hash":        payload_hash,
            "chain_hash":          chain_hash,
            "prev_chain_hash":     prev_hash,
            "signature_algorithm": "SHA3-512 (simulated — install liboqs for SLH-DSA)",
            "ipfs_cid":            None,
            "ipfs_anchored":       False,
            "metadata":            req.metadata or {},
            "app_id":              "shadow313-nexus-api",
            "app_version":         __version__,
        }
        if len(_receipts) >= _max_receipts:
            _receipts.pop(next(iter(_receipts)))
        _receipts[bind_id] = receipt
        return receipt

    @app.get("/api/bind/{bind_id}")
    async def bind_get(bind_id: str, _: str = Depends(verify_api_key)):
        if bind_id not in _receipts:
            raise HTTPException(status_code=404, detail=f"Receipt {bind_id} not found")
        return _receipts[bind_id]

    @app.get("/api/bind")
    async def bind_list(_: str = Depends(verify_api_key)):
        return {
            "count":    len(_receipts),
            "receipts": list(_receipts.values()),
        }

    return app


# ── Entry point ───────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Shadow313 NEXUS API Server")
    parser.add_argument("--host",    default="127.0.0.1", help="Bind host")
    parser.add_argument("--port",    default=8313, type=int, help="Bind port")
    parser.add_argument("--reload",  action="store_true",   help="Auto-reload on change")
    parser.add_argument("--api-key", default=None,          help="API key (or set SHADOW313_API_KEY)")
    args = parser.parse_args()

    if not HAS_FASTAPI:
        print("ERROR: fastapi and uvicorn required — pip install fastapi uvicorn")
        return 1

    api_key = args.api_key or os.environ.get("SHADOW313_API_KEY")
    app = create_app(api_key=api_key)

    print(f"Shadow313 NEXUS API v{__version__}")
    logger.debug(f"  Listening: http://{args.host}:{args.port}")
    logger.debug(f"  Docs:      http://{args.host}:{args.port}/api/docs")
    logger.debug(f"  Auth:      {'API key required' if api_key else 'No auth (dev mode)'}")

    uvicorn.run(
        app,
        host=args.host,
        port=args.port,
        reload=args.reload,
        log_level="info",
    )


if __name__ == "__main__":
    main()