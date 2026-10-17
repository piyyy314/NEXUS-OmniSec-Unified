# 🛡️ NEXUS OmniSec Unified

[![Status](https://img.shields.io/badge/Status-Operational-10b981?style=for-the-badge&logo=shield)](https://github.com/piyyy314/NEXUS-OmniSec-Unified)
[![Post-Quantum Cryptography](https://img.shields.io/badge/PQC-FIPS%20203%20%7C%20204%20%7C%20205-blue?style=for-the-badge&logo=quantum)](https://github.com/piyyy314/NEXUS-OmniSec-Unified)
[![React](https://img.shields.io/badge/Frontend-React%2019%20%2B%20Vite-61dafb?style=for-the-badge&logo=react)](https://github.com/piyyy314/NEXUS-OmniSec-Unified)
[![Python](https://img.shields.io/badge/Core-Python%203.12%20%2B%20Qiskit-3776ab?style=for-the-badge&logo=python)](https://github.com/piyyy314/NEXUS-OmniSec-Unified)
[![License](https://img.shields.io/badge/Security-Classified%20%2F%20Private-red?style=for-the-badge)](https://github.com/piyyy314/NEXUS-OmniSec-Unified)

---

## 🛰️ Executive Overview

**NEXUS OmniSec Unified** is the unified convergence of five tactical cyber-warfare, SIGINT intelligence, and post-quantum defense platforms:

1. **Aegis Sentinel Security Dashboard** — Live active defense SOC monitoring, heuristic AST analysis, and security posture auditing.
2. **Ghost-Watch C2 Workstation** — Apex-tier operations interface, Advanced Canary Trap Ecosystem (ACTS), and dynamic countermeasure orchestrator.
3. **SatExpert Tactical SatCom Intelligence (TSI v6)** — 79 military-grade VSAT/SIGINT modules, AI Sentinel control, drone swarm kinematics, orbital strikers, and spectrum warfare.
4. **Shadow313 NEXUS Engine** — 29 automated threat detectors, behavioral baseline drift monitoring (`SentinelBaseline` v6.0.0), and STIX/TAXII threat intelligence.
5. **Project AEON & The SecureDev Arsenal** — Omni-dimensional quantum cyber core featuring the **3-1-3 Protocol Binding** (`ML-KEM-768` + `ML-DSA-65` + `QE-BIM`), Chrono-Entangled Quantum Sentinel (CEQS), Non-Hermitian ML sensing, and the OS-level Process Sentinel daemon.

---

## 🏛️ Monorepo Architecture

```
NEXUS-OmniSec-Unified/
├── client/                     # Unified Command & Control Web Workstation
│   ├── src/
│   │   ├── components/
│   │   │   ├── satexpert/      # 79 Tactical Modules (SentinelAI, Swarm, Palantir, SCADA, etc.)
│   │   │   ├── ghostwatch/     # 12 Tactical C2 Modules, Audio Synthesizer, CRT Shaders
│   │   │   ├── apex/           # Quantum Tensor Views (Nebula, Titan, Hyperion, CodeVault)
│   │   │   └── shell/          # Master Workspace Switcher, AI Copilot Sidecar, Global HUD
│   │   ├── modules/
│   │   │   ├── aegis/          # Aegis SOC Dashboard
│   │   │   ├── ghostwatch/     # Ghost-Watch C2 Terminal
│   │   │   ├── nexus/          # Shadow313 Engine & 29 Detectors Grid
│   │   │   └── modellab/       # Multi-Model AI Latency & Cost Simulator
│   │   ├── services/           # PQC Engine, Satellite Propagator, Forensic Engine, Gemini API
│   │   └── App.tsx             # Master Coordinator Shell
│   ├── package.json            # React 19, Tailwind, Recharts, Motion, Lucide
│   └── vite.config.ts
│
├── core/                       # Python Cyber Warfare & Intelligence Engine
│   ├── shadow313/              # Full Shadow313 Kernel, Blue Team, Red Team, Quantum, Intel
│   │   └── tools/blueteam/     # SentinelBaseline v6.0.0 drift detector
│   ├── arsenal/                # 90 Original Python Tools & Engines
│   │   ├── aeon_omni_core.py   # Project AEON: 3-1-3 Binding & Quantum Entanglement Monitor
│   │   ├── process_sentinel.py # Live OS-level process hunter & terminator
│   │   ├── project_hyperion.py # Exascale Boundary MPS & Kraus Noise Engine
│   │   ├── project_titan.py    # Distributed GPU 2D PEPS Engine
│   │   └── quantum_tensor.py   # Quantum-inspired tensor network simulations
│   ├── tests/                  # Shadow313 test suites (3,799 unit & integration tests)
│   └── requirements.txt        # Qiskit, Scikit-learn, FastAPI, Cryptography, Rich
│
├── deploy/                     # Enterprise Infrastructure & Orchestration
│   ├── docker-compose.yml      # Multi-service containerized stack
│   ├── Dockerfile              # Hardened production container
│   └── manifests/              # Ingress, reverse proxy, and monitoring configs
│
└── docs/                       # Mission Briefs, STIX Feeds & Architectural Diagrams
    ├── aegis_nexus.html        # Interactive architecture visualizer
    ├── chronos-sentinel.html   # Temporal sentinel threat visualizer
    └── session-exports/        # Threat vault and incident forensic logs
```

---

## ⚡ Quick Start

### 1. Launch the Unified Web Workstation (`client/`)

```bash
cd client
npm install --legacy-peer-deps
npm run dev
```
> Workstation interface will be active at `http://localhost:3000`.

### 2. Launch the Python Intelligence Engine (`core/`)

```bash
cd core
python -m venv venv
venv\Scripts\activate       # On Windows
pip install -r requirements.txt
```

#### Run the Process Sentinel Daemon
```bash
python arsenal/process_sentinel.py
```

#### Run Project AEON (Omni-Dimensional Core)
```bash
python arsenal/aeon_omni_core.py
```

---

## 🔐 The 3-1-3 Security Protocol

Implemented in `core/arsenal/aeon_omni_core.py`, the **3-1-3 Protocol** enforces cryptographic downgrade protection across three distinct layers:

$$\mathcal{H}_{313} = \text{SHA3-512}\Big(\text{ML-KEM-768} \parallel \text{ML-DSA-65} \parallel \text{QE-BIM Bell State}\Big)$$

If an adversary intercepts traffic and attempts to strip quantum-resistant key exchanges to force legacy primitives ($X25519$), the tripartite bond shatters instantly, dropping all connections and triggering honeypot quarantine protocols.

---

## 🛰️ 79 Integrated SatExpert TSI Modules

Located in `client/src/components/satexpert/`:
* **Command & Control:** `SentinelAIControl`, `AegisC2`, `DroneSwarmCommand`, `TacticalHUD`, `MissionPlanner`
* **SIGINT & RF Warfare:** `RadioInterceptSuite`, `SpectrumAnalyzer`, `SignalInterceptor`, `SignalJammer`
* **Quantum Defense:** `KyberlaserQkdVault`, `GroverVisualizer`, `QuantumIntelligenceHub`, `PQCMigrationTimeline`
* **Red & Purple Team:** `PurpleTeamArsenal`, `ZeroDayForge`, `SCADAExploit`, `RansomwareSim`, `CyberKillChain`
* **Forensics & Audit:** `PalantirAuditSuite`, `YARAScanner`, `ThreatDossier`, `ForensicAuditor`

---

## 👤 Author & Maintainer
* **Architect:** Mohamad Matar ([@piyyy314](https://github.com/piyyy314))
* **Identity:** Shadow313 / Baalbek 313 Intelligence Labs
