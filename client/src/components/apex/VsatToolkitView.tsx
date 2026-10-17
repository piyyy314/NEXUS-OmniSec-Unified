import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Search, 
  FileCheck2, 
  Crosshair, 
  Radio, 
  Lock, 
  FileCode, 
  Download, 
  Copy, 
  Check, 
  AlertTriangle, 
  Sparkles,
  Server,
  Play
} from 'lucide-react';
import { CREATIONS_ARCHIVE } from '../data/creationsData';

export const VsatToolkitView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'hunt' | 'audit' | 'sim' | 'siem' | 'hardening' | 'scripts'>('overview');
  
  // Threat Hunting state
  const [huntEnv, setHuntEnv] = useState('Maritime VSAT Fleet');
  const [huntScope, setHuntScope] = useState('192.168.10.0/24, modem-gw.sat.corp');
  const [intelFeeds, setIntelFeeds] = useState({
    cisa: true,
    mitre: true,
    openioc: true,
    yara: false
  });
  const [huntOutput, setHuntOutput] = useState<string | null>(null);

  // Audit state
  const [framework, setFramework] = useState('NIST SP 800-53 (Rev 5)');
  const [auditComponent, setAuditComponent] = useState('Satellite Modem Configuration');
  const [auditOutput, setAuditOutput] = useState<string | null>(null);

  // Simulation state
  const [threatActor, setThreatActor] = useState('APT28 (Fancy Bear) - Recon & Credential Theft');
  const [simOutput, setSimOutput] = useState<string | null>(null);

  // SIEM state
  const [siemPlatform, setSiemPlatform] = useState('Splunk Enterprise Security');
  const [siemOutput, setSiemOutput] = useState<string | null>(null);

  // Script viewer
  const [selectedScriptIndex, setSelectedScriptIndex] = useState(0);
  const [copiedScript, setCopiedScript] = useState(false);

  const vsatArtifact = CREATIONS_ARCHIVE.find(a => a.id === 'vsat-toolkit');

  const handleDownloadStandaloneHtml = () => {
    if (!vsatArtifact) return;
    const blob = new Blob([vsatArtifact.code], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'vsat_blue_team_toolkit.html';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleGenerateHuntPlan = () => {
    const feeds = Object.entries(intelFeeds)
      .filter(([_, v]) => v)
      .map(([k]) => k.toUpperCase())
      .join(', ');

    setHuntOutput(`=======================================================
VSAT HYPOTHESIS-DRIVEN THREAT HUNTING PLAN (NSA/CISA 2026)
Generated: ${new Date().toISOString()}
Target Environment: ${huntEnv}
Scope Subnets: ${huntScope}
Active Feeds: ${feeds || 'None selected'}
=======================================================

1. HYPOTHESIS:
"Adversary groups (e.g. Sandworm, APT28) are leveraging remote command injection 
(CVE-2024-6199) and TR-069 ACS configuration poisoning to manipulate VSAT satellite 
modem routing tables and spoof telemetry data."

2. TARGET ARTIFACTS & DATA SOURCES:
- Modem Syslog Daemon (UDP/TCP 514) -> Forward to SIEM
- Management Web Access Logs (/var/log/lighttpd/access.log)
- TR-069 CWMP Session Logs & ACS TLS Handshakes
- RF Signal Metrics: Sudden drop in Signal-to-Noise Ratio (SNR < 2.0 dB) or Bit Error Rate (BER > 1e-3)

3. HUNTING QUERIES & IOC HUNTING:
Query A [Command Injection Inspection]:
  grep -E '[;&|\`$]\\s*(whoami|id|cat|ls|ping|nc|curl|wget)' /var/log/httpd/access.log
Query B [TR-069 Rogue ACS Source]:
  netstat -antp | grep ':7547' | awk '{print $5}' | grep -vFf /etc/vsat/allowed_acs_ips.txt
Query C [Suspicious Firmware Modifications]:
  find /boot /opt/vsat -name '*.bin' -or -name '*.conf' -mtime -2 -exec sha256sum {} \\;

4. RESPONSE & ISOLATION RUNBOOK:
- Step 1: Trigger Emergency Out-of-Band VSAT RF Transmit Mute (Bypass compromised web shell).
- Step 2: Snapshot running volatile memory via serial console or debug interface.
- Step 3: Reflash cryptographically signed factory firmware via hardware recovery jumper.`);
  };

  const handleGenerateAuditChecklist = () => {
    setAuditOutput(`=======================================================
VSAT SECURITY COMPLIANCE AUDIT CHECKLIST
Framework: ${framework}
Target Component: ${auditComponent}
Validation Standard: NSA & CISA VSAT Hardening Guide (2026)
=======================================================

[1. ACCESS CONTROL (NIST AC-2, AC-3, AC-6)]
[ ] Check 1.1: Default factory credentials (admin/admin, root/toor) permanently disabled.
[ ] Check 1.2: Management authentication requires MFA or Client Certificate (mTLS).
[ ] Check 1.3: SSH root login explicitly disabled (PermitRootLogin no in sshd_config).
[ ] Check 1.4: Inactive session timeout capped at 300 seconds (5 minutes).

[2. CRYPTOGRAPHY & NETWORK PROTOCOLS (NIST SC-8, SC-13)]
[ ] Check 2.1: Insecure plaintext protocols (HTTP port 80, Telnet port 23) disabled on WAN and LAN.
[ ] Check 2.2: Management HTTPS enforces TLS 1.3 or minimum TLS 1.2 with PFS cipher suites.
[ ] Check 2.3: SNMPv1 and SNMPv2c disabled; SNMPv3 with authPriv (SHA-256 + AES-256) enforced.
[ ] Check 2.4: Satellite carrier link uses link-layer encryption (FIPS 140-3 Level 2 certified).

[3. SYSTEM INTEGRITY & FIRMWARE (NIST SI-7, CM-6)]
[ ] Check 3.1: Hardware JTAG / UART serial debug pins disabled or physically sealed.
[ ] Check 3.2: Secure Boot enabled; kernel and modem firmware validated via RSA-4096 / PQC Dilithium.
[ ] Check 3.3: Configuration files cryptographically hashed; daily FIM validation active.

[4. LOGGING & AUDIT TRAIL (NIST AU-2, AU-6)]
[ ] Check 4.1: Remote syslog forwarding enabled with TLS transport to primary and secondary SIEM.
[ ] Check 4.2: Clock synchronized via authenticated NTP (RFC 5905 Network Time Protocol).
[ ] Check 4.3: Local audit log storage buffer configured for minimum 30 days retention.`);
  };

  const handleGenerateSimulation = () => {
    setSimOutput(`=======================================================
CONTROLLED ADVERSARY EMULATION SEQUENCE
Threat Actor: ${threatActor}
Environment Safety: Isolated Test Lab / Cyber Range Only
=======================================================

STAGE 1: RECONNAISSANCE & PORT PROBING (MITRE ATT&CK TA0043)
- Simulated Tool: Scapy custom packet injector
- Action: Syn-scan on ports 22, 23, 80, 443, 161, 7547 across lab subnet.
- Blue Team Validation Goal: IDS (Suricata) alert within 15 seconds.

STAGE 2: BRUTE-FORCE & AUTHENTICATION BYPASS (TA0001, TA0006)
- Action: Emulate dictionary attack against SSH and TR-069 ACS endpoints.
- Blue Team Validation Goal: Account rate-limiting triggers after 5 failures; SIEM alert severity HIGH.

STAGE 3: COMMAND INJECTION PAYLOAD SIMULATION (TA0002)
- Action: Send safe test command: \`/bin/echo VSAT_VALIDATION_TEST_OK\` via web parameters.
- Blue Team Validation Goal: WAF or host-based log analyzer flags pattern \`; echo\` and drops socket.

STAGE 4: LATERAL MOVEMENT PREVENTION TEST (TA0008)
- Action: Attempt inter-VLAN routing from simulated VSAT guest LAN to critical SCADA VLAN.
- Blue Team Validation Goal: Layer 3 firewall bidirectional rule rejects packet with TCP RST.`);
  };

  const handleGenerateSiem = () => {
    setSiemOutput(`=======================================================
SIEM INGESTION CONFIGURATION: ${siemPlatform}
Log Source: VSAT Satellite Modem Syslog (RFC 5424)
=======================================================

1. RSYSLOG DAEMON CONFIG (/etc/rsyslog.d/50-vsat.conf):
# Ingest local and remote VSAT modems
$ModLoad imudp
$UDPServerRun 514
$template VSATFormat,"<%pri%>%protocol-version% %timestamp:::date-rfc3339% %HOSTNAME% %app-name% %procid% %msgid% %msg%\\n"

if $programname == 'vsat_daemon' then /var/log/vsat_modem.log;VSATFormat
if $msg contains 'auth failed' then @@siem-collector.internal.net:6514;VSATFormat

2. SPLUNK / ELASTIC CORRELATION DETECTION RULES:
Rule Name: VSAT_RCE_Command_Injection_Detected
Filter: sourcetype="vsat:syslog" AND (
  message=~"[;&|\`$]\\s*(whoami|id|cat|ls|ping|chmod|chown)"
  OR message=~"\\$\\([a-zA-Z0-9_-]+\\)"
)
Severity: Critical
Action: Trigger Automated SOAR Playbook -> Isolate IP at Border Firewall -> Page SOC On-Call.

Rule Name: VSAT_Signal_Degradation_Anomaly
Filter: sourcetype="vsat:metrics" AND (snr_db < 2.5 OR bit_error_rate > 0.001)
Severity: High
Action: Flag Potential RF Jamming or Uplink Weather Interference.`);
  };

  const defensiveScripts = [
    {
      title: '1. RCE Attempt Detector (Python)',
      filename: 'vsat_log_analyzer.py',
      description: 'Scans VSAT web and system logs for command injection payloads and regex exploit signatures.',
      code: `#!/usr/bin/env python3
# VSAT Log Analyzer - Detects Command Injection & RCE Attempts
import re
import sys
import json
from datetime import datetime

PATTERNS = {
    'command_injection': [
        r'[;&|\`$]\\s*(whoami|id|cat|ls|dir|ping|curl|wget)',
        r'\\$\\(.*?\\)',
        r'\`.*?\`',
        r'\\|\\s*(sh|bash|dash|cmd)'
    ],
    'auth_failure': [
        r'authentication failure',
        r'failed password',
        r'invalid user'
    ],
    'unauthorized_config': [
        r'firmware update initiated',
        r'factory reset',
        r'acs connection url modified'
    ]
}

def analyze_logs(logfile):
    findings = []
    try:
        with open(logfile, 'r') as f:
            for line_no, line in enumerate(f, 1):
                for category, regex_list in PATTERNS.items():
                    for pattern in regex_list:
                        if re.search(pattern, line, re.IGNORECASE):
                            findings.append({
                                'line': line_no,
                                'category': category,
                                'timestamp': datetime.now().isoformat(),
                                'match': pattern,
                                'evidence': line.strip()[:180]
                            })
        print(f"[+] Scan Complete: {len(findings)} security events discovered.")
        return findings
    except Exception as e:
        print(f"[-] Error parsing log file: {e}")
        return []

if __name__ == '__main__':
    log = sys.argv[1] if len(sys.argv) > 1 else '/var/log/modem.log'
    results = analyze_logs(log)
    print(json.dumps(results, indent=2))`
    },
    {
      title: '2. File Integrity Monitor (Python)',
      filename: 'vsat_fim.py',
      description: 'Calculates SHA-256 hashes of critical VSAT configuration and firmware files to detect unauthorized tampering.',
      code: `#!/usr/bin/env python3
# VSAT File Integrity Monitor (FIM)
import hashlib
import json
import os
from datetime import datetime

CRITICAL_PATHS = [
    '/etc/passwd',
    '/etc/shadow',
    '/etc/ssh/sshd_config',
    '/opt/vsat/config/modem.conf',
    '/boot/firmware/vsat.bin'
]

def hash_file(filepath):
    if not os.path.exists(filepath): return None
    h = hashlib.sha256()
    with open(filepath, 'rb') as f:
        while chunk := f.read(8192):
            h.update(chunk)
    return h.hexdigest()

def verify_baseline(baseline_file='/tmp/vsat_baseline.json'):
    baseline = {}
    if os.path.exists(baseline_file):
        with open(baseline_file, 'r') as f: baseline = json.load(f)
    
    alerts = []
    new_baseline = {}
    for path in CRITICAL_PATHS:
        current = hash_file(path)
        new_baseline[path] = current
        if path in baseline and baseline[path] != current:
            alerts.append({'file': path, 'old': baseline[path], 'new': current})
            print(f"[!] INTEGRITY BREACH: {path} has been tampered with!")

    with open(baseline_file, 'w') as f: json.dump(new_baseline, f, indent=2)
    return alerts

if __name__ == '__main__':
    verify_baseline()`
    },
    {
      title: '3. SIEM Syslog Event Forwarder (Python)',
      filename: 'vsat_siem_forwarder.py',
      description: 'Real-time daemon that tails VSAT system logs and securely streams formatted JSON to centralized SIEM servers.',
      code: `#!/usr/bin/env python3
# VSAT SIEM Event Forwarder
import socket
import json
import time
import sys
from datetime import datetime

class SIEMForwarder:
    def __init__(self, host='127.0.0.1', port=514, proto='udp'):
        self.host = host
        self.port = port
        self.proto = proto
        self.sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM if proto == 'udp' else socket.SOCK_STREAM)
        if proto == 'tcp': self.sock.connect((host, port))

    def emit(self, msg, severity='INFO'):
        payload = {
            'timestamp': datetime.utcnow().isoformat() + 'Z',
            'system': 'VSAT-MODEM-GATEWAY',
            'severity': severity,
            'message': msg
        }
        data = (json.dumps(payload) + '\\n').encode('utf-8')
        if self.proto == 'udp':
            self.sock.sendto(data, (self.host, self.port))
        else:
            self.sock.sendall(data)
        print(f"[+] Forwarded event: {msg[:60]}...")

if __name__ == '__main__':
    fwd = SIEMForwarder()
    fwd.emit("VSAT gateway service initialized. Listening for satellite carriers.", "INFO")`
    },
    {
      title: '4. Security Compliance Checker (Bash)',
      filename: 'vsat_compliance_check.sh',
      description: 'Automated POSIX shell script testing system configuration against NSA/CISA zero-trust hardening guidelines.',
      code: `#!/bin/bash
# VSAT NSA/CISA Baseline Compliance Checker
PASS=0
FAIL=0

check() {
    local name="$1"
    local cmd="$2"
    local expect="$3"
    printf "Testing: %-40s ... " "$name"
    res=$(eval "$cmd" 2>/dev/null | head -1)
    if [[ "$res" == *"$expect"* ]]; then
        echo -e "\\e[32mPASS\\e[0m"
        ((PASS++))
    else
        echo -e "\\e[31mFAIL\\e[0m (Got: $res)"
        ((FAIL++))
    fi
}

echo "=== VSAT HARDENING COMPLIANCE SCAN (2026) ==="
check "HTTP Port 80 Disabled" "ss -tlpn | grep ':80 '" ""
check "Telnet Port 23 Disabled" "ss -tlpn | grep ':23 '" ""
check "SSH Enforced" "systemctl is-active ssh" "active"
check "SNMPv3 Configured" "grep -E '^defSecurityModel.*USM' /etc/snmp/snmp.conf" "USM"

echo "============================================="
echo "Results: $PASS Passed, $FAIL Failed"`
    }
  ];

  return (
    <div className="space-y-6">
      
      {/* Banner Card */}
      <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-950/40 via-slate-900/60 to-slate-900/80 p-6 glow-emerald">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-400 font-mono text-xs border border-emerald-500/30 font-semibold">
                NSA / CISA 2026 SPECIFICATION
              </span>
              <span className="text-xs text-slate-400 font-mono">STANDALONE WEB APP &bull; ZERO BACKEND REQUIRED</span>
            </div>
            <h2 className="text-2xl font-bold text-white mt-2 flex items-center gap-2">
              <Radio className="h-6 w-6 text-emerald-400" />
              VSAT Blue Team Toolkit v2.0
            </h2>
            <p className="text-sm text-slate-300 max-w-3xl mt-1">
              Comprehensive defensive monitoring, threat hunting, and hardening framework engineered specifically for
              satellite communication links, maritime earth stations, SCADA VSAT networks, and high-frequency modems.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleDownloadStandaloneHtml}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition shadow-lg shadow-emerald-500/20"
            >
              <Download className="h-4 w-4" />
              <span>Download Standalone HTML</span>
            </button>
          </div>
        </div>
      </div>

      {/* Toolkit Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-medium transition ${
            activeTab === 'overview'
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <ShieldCheck className="h-4 w-4" />
          <span>Overview</span>
        </button>

        <button
          onClick={() => setActiveTab('hunt')}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-medium transition ${
            activeTab === 'hunt'
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Search className="h-4 w-4" />
          <span>Threat Hunting</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-medium transition ${
            activeTab === 'audit'
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <FileCheck2 className="h-4 w-4" />
          <span>Security Audit</span>
        </button>

        <button
          onClick={() => setActiveTab('sim')}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-medium transition ${
            activeTab === 'sim'
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Crosshair className="h-4 w-4" />
          <span>Threat Simulation</span>
        </button>

        <button
          onClick={() => setActiveTab('siem')}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-medium transition ${
            activeTab === 'siem'
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Server className="h-4 w-4" />
          <span>SIEM &amp; Ingestion</span>
        </button>

        <button
          onClick={() => setActiveTab('hardening')}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-medium transition ${
            activeTab === 'hardening'
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Lock className="h-4 w-4" />
          <span>Hardening Checklists</span>
        </button>

        <button
          onClick={() => setActiveTab('scripts')}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-medium transition ${
            activeTab === 'scripts'
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <FileCode className="h-4 w-4" />
          <span>Defensive Scripts (4)</span>
        </button>
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/60 hover:border-emerald-500/40 transition">
            <div className="flex items-center space-x-2 text-emerald-400 mb-2">
              <Search className="h-5 w-5" />
              <h3 className="font-semibold text-white">Proactive Threat Hunting</h3>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Hypothesis-driven search for advanced persistent threat indicators, rogue TR-069 ACS calls, and command injection artifacts.
            </p>
            <button
              onClick={() => setActiveTab('hunt')}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1"
            >
              Open Threat Hunter &rarr;
            </button>
          </div>

          <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/60 hover:border-emerald-500/40 transition">
            <div className="flex items-center space-x-2 text-cyan-400 mb-2">
              <FileCheck2 className="h-5 w-5" />
              <h3 className="font-semibold text-white">Compliance Audit</h3>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Instant generation of actionable security compliance checklists mapped to NIST SP 800-53 Rev 5, ISO 27001, and CISA goals.
            </p>
            <button
              onClick={() => setActiveTab('audit')}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1"
            >
              Run Audit Generator &rarr;
            </button>
          </div>

          <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/60 hover:border-emerald-500/40 transition">
            <div className="flex items-center space-x-2 text-amber-400 mb-2">
              <Crosshair className="h-5 w-5" />
              <h3 className="font-semibold text-white">Threat Emulation</h3>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Controlled adversary simulation playbooks targeting APT28, APT33, and Sandworm satellite compromise techniques.
            </p>
            <button
              onClick={() => setActiveTab('sim')}
              className="text-xs text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1"
            >
              Configure Simulation &rarr;
            </button>
          </div>

          <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/60 hover:border-emerald-500/40 transition">
            <div className="flex items-center space-x-2 text-indigo-400 mb-2">
              <Server className="h-5 w-5" />
              <h3 className="font-semibold text-white">SIEM &amp; Syslog Streamer</h3>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Syslog parsers and correlation rules for Splunk, Elastic, Sentinel, and IBM QRadar to trap RCE and signal drops.
            </p>
            <button
              onClick={() => setActiveTab('siem')}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
            >
              View Ingestion Config &rarr;
            </button>
          </div>

          <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/60 hover:border-emerald-500/40 transition">
            <div className="flex items-center space-x-2 text-purple-400 mb-2">
              <Lock className="h-5 w-5" />
              <h3 className="font-semibold text-white">Zero Trust Hardening</h3>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              NSA/CISA hardening standards for disabling vulnerable debug serial ports, enforcing SSH keys, and mTLS.
            </p>
            <button
              onClick={() => setActiveTab('hardening')}
              className="text-xs text-purple-400 hover:text-purple-300 font-medium flex items-center gap-1"
            >
              Inspect Checklists &rarr;
            </button>
          </div>

          <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/60 hover:border-emerald-500/40 transition">
            <div className="flex items-center space-x-2 text-emerald-400 mb-2">
              <FileCode className="h-5 w-5" />
              <h3 className="font-semibold text-white">Defensive Python/Bash Scripts</h3>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              4 production-ready scripts: RCE log scanner, file integrity baseline validator, SIEM UDP forwarder, and bash checker.
            </p>
            <button
              onClick={() => setActiveTab('scripts')}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1"
            >
              Open Script Viewer &rarr;
            </button>
          </div>
        </div>
      )}

      {/* Tab 2: Threat Hunting */}
      {activeTab === 'hunt' && (
        <div className="space-y-4">
          <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/70 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <Search className="h-5 w-5 text-emerald-400" />
                Configure Threat Hunting Parameters
              </h3>
              <span className="text-xs font-mono text-slate-400">MITRE ATT&CK for ICS Matrix</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Hunting Environment:</label>
                <select
                  value={huntEnv}
                  onChange={(e) => setHuntEnv(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  <option>Maritime VSAT Fleet</option>
                  <option>Energy/SCADA VSAT Network</option>
                  <option>Remote Enterprise VSAT</option>
                  <option>Government/Military Ground Station</option>
                  <option>Broadcast Video Feeder Link</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Hunting Scope (CIDRs / Hostnames):</label>
                <input
                  type="text"
                  value={huntScope}
                  onChange={(e) => setHuntScope(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-2">Threat Intelligence Feeds:</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                {Object.entries(intelFeeds).map(([key, val]) => (
                  <label key={key} className="flex items-center space-x-2 bg-slate-950 p-2.5 rounded-lg border border-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={val}
                      onChange={(e) => setIntelFeeds({ ...intelFeeds, [key]: e.target.checked })}
                      className="rounded border-slate-700 text-emerald-500 focus:ring-0"
                    />
                    <span className="text-slate-300 uppercase font-mono">{key} Feed</span>
                  </label>
                ))}
              </div>
            </div>

            <button
              onClick={handleGenerateHuntPlan}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition shadow-md shadow-emerald-600/30"
            >
              <Play className="h-4 w-4" />
              <span>Generate Threat Hunting Plan</span>
            </button>
          </div>

          {huntOutput && (
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-950 font-mono text-xs text-emerald-400 overflow-x-auto whitespace-pre leading-relaxed">
              {huntOutput}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Security Audit */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/70 space-y-4">
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <FileCheck2 className="h-5 w-5 text-cyan-400" />
              Generate VSAT Security Compliance Checklist
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Compliance Framework:</label>
                <select
                  value={framework}
                  onChange={(e) => setFramework(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  <option>NIST SP 800-53 (Rev 5)</option>
                  <option>ISO 27001:2022</option>
                  <option>CISA Cross-Sector Cybersecurity Performance Goals</option>
                  <option>NERC CIP (Energy Sector VSAT)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Target VSAT Subsystem:</label>
                <select
                  value={auditComponent}
                  onChange={(e) => setAuditComponent(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  <option>Satellite Modem Configuration</option>
                  <option>Network Infrastructure (Routers / Switches)</option>
                  <option>Management Interfaces (Web / API / SNMP)</option>
                  <option>Physical Antenna &amp; BUC/LNB Cabling</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleGenerateAuditChecklist}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs transition shadow-md shadow-cyan-600/30"
            >
              <FileCheck2 className="h-4 w-4" />
              <span>Generate Audit Checklist</span>
            </button>
          </div>

          {auditOutput && (
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-950 font-mono text-xs text-cyan-300 overflow-x-auto whitespace-pre leading-relaxed">
              {auditOutput}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Simulation */}
      {activeTab === 'sim' && (
        <div className="space-y-4">
          <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/70 space-y-4">
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <Crosshair className="h-5 w-5 text-amber-400" />
              Adversary Emulation &amp; Defense Validation Plan
            </h3>

            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>
                <strong>Authorization Notice:</strong> Emulation scripts must only be executed in verified offline cyber-ranges
                or non-operational VSAT modems under strict change control.
              </span>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Threat Actor Profile:</label>
              <select
                value={threatActor}
                onChange={(e) => setThreatActor(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
              >
                <option>APT28 (Fancy Bear) - Recon & Credential Theft</option>
                <option>APT33 (Elfin) - Supply Chain & SCADA</option>
                <option>Sandworm - Satellite/ICS Disruption</option>
                <option>Generic Nation-State Satellite Ground Interceptor</option>
              </select>
            </div>

            <button
              onClick={handleGenerateSimulation}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-medium text-xs transition shadow-md shadow-amber-600/30"
            >
              <Play className="h-4 w-4" />
              <span>Generate Emulation Sequence</span>
            </button>
          </div>

          {simOutput && (
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-950 font-mono text-xs text-amber-300 overflow-x-auto whitespace-pre leading-relaxed">
              {simOutput}
            </div>
          )}
        </div>
      )}

      {/* Tab 5: SIEM */}
      {activeTab === 'siem' && (
        <div className="space-y-4">
          <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/70 space-y-4">
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <Server className="h-5 w-5 text-indigo-400" />
              SIEM Log Ingestion &amp; Correlation Generator
            </h3>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">SIEM Platform Target:</label>
              <select
                value={siemPlatform}
                onChange={(e) => setSiemPlatform(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option>Splunk Enterprise Security</option>
                <option>Elastic Security (ELK)</option>
                <option>Microsoft Sentinel</option>
                <option>IBM QRadar</option>
              </select>
            </div>

            <button
              onClick={handleGenerateSiem}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition shadow-md shadow-indigo-600/30"
            >
              <Server className="h-4 w-4" />
              <span>Generate Ingestion &amp; Correlation Rules</span>
            </button>
          </div>

          {siemOutput && (
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-950 font-mono text-xs text-indigo-300 overflow-x-auto whitespace-pre leading-relaxed">
              {siemOutput}
            </div>
          )}
        </div>
      )}

      {/* Tab 6: Hardening Checklists */}
      {activeTab === 'hardening' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/70 space-y-3">
            <div className="flex items-center space-x-2 text-emerald-400 font-semibold text-sm">
              <Lock className="h-5 w-5" />
              <span>Credential &amp; Network Hardening</span>
            </div>
            <ul className="text-xs text-slate-300 space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-mono">&#x2713;</span>
                <span>Change all factory credentials on delivery; enforce 16+ char random passwords.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-mono">&#x2713;</span>
                <span>Disable HTTP web server (port 80) and Telnet (port 23) in modem kernel config.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-mono">&#x2713;</span>
                <span>Enforce TLS 1.3 for management HTTPS and drop obsolete cipher suites (CBC, 3DES).</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-mono">&#x2713;</span>
                <span>Disable SNMPv1/v2c plaintext communities; upgrade to SNMPv3 USM with SHA-256/AES.</span>
              </li>
            </ul>
          </div>

          <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/70 space-y-3">
            <div className="flex items-center space-x-2 text-cyan-400 font-semibold text-sm">
              <ShieldCheck className="h-5 w-5" />
              <span>Zero-Trust Architecture Guidelines</span>
            </div>
            <ul className="text-xs text-slate-300 space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-cyan-400 font-mono">&#x2713;</span>
                <span>Place VSAT modems in isolated WAN DMZ VLAN; prohibit direct bridge to internal LAN.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-400 font-mono">&#x2713;</span>
                <span>Enforce bidirectional stateful inspection on all traffic arriving via satellite transponder.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-400 font-mono">&#x2713;</span>
                <span>Tunnel all mission-critical data over WireGuard or IPsec with Post-Quantum key exchange.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-400 font-mono">&#x2713;</span>
                <span>Physically seal UART/JTAG debugging connectors to prevent local memory extraction.</span>
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* Tab 7: Defensive Scripts */}
      {activeTab === 'scripts' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Select Defensive Script</h4>
            {defensiveScripts.map((s, idx) => (
              <button
                key={s.filename}
                onClick={() => setSelectedScriptIndex(idx)}
                className={`w-full text-left p-3.5 rounded-xl border transition flex flex-col gap-1 ${
                  selectedScriptIndex === idx
                    ? 'border-emerald-500/50 bg-emerald-950/20 text-white'
                    : 'border-slate-800 bg-slate-900/50 text-slate-300 hover:border-slate-700 hover:bg-slate-900'
                }`}
              >
                <span className="text-xs font-semibold">{s.title}</span>
                <span className="text-[11px] font-mono text-slate-400">{s.filename}</span>
              </button>
            ))}
          </div>

          <div className="lg:col-span-2 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-white">{defensiveScripts[selectedScriptIndex].title}</h4>
                <p className="text-xs text-slate-400">{defensiveScripts[selectedScriptIndex].description}</p>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(defensiveScripts[selectedScriptIndex].code);
                  setCopiedScript(true);
                  setTimeout(() => setCopiedScript(false), 2000);
                }}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition"
              >
                {copiedScript ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copiedScript ? 'Copied' : 'Copy Script'}</span>
              </button>
            </div>

            <div className="p-4 rounded-xl border border-slate-800 bg-slate-950 font-mono text-xs text-emerald-400 overflow-x-auto whitespace-pre leading-relaxed">
              {defensiveScripts[selectedScriptIndex].code}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
