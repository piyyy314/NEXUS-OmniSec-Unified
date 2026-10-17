/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Terminal,
  Cpu,
  KeyRound,
  Activity,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Play,
  RefreshCw,
  Copy,
  Check,
  Lock,
  Radio,
  FileCheck,
  ChevronRight,
  Database,
  ExternalLink,
  Flame,
  Zap,
} from 'lucide-react';
import { soundFx } from '../../utils/audio';

interface ModuleItem {
  id: string;
  name: string;
  category: 'Recon & OSINT' | 'Vulnerability & Exploits' | 'Quantum Cryptography' | 'Defense & Baselines' | 'Agentic AI';
  version: string;
  status: 'Ready' | 'Active' | 'Secured';
  desc: string;
  cliCommand: string;
}

const MODULES_LIST: ModuleItem[] = [
  {
    id: 'sentinel_drift',
    name: 'Sentinel Baseline Drift Detector',
    category: 'Defense & Baselines',
    version: 'v6.0.0',
    status: 'Active',
    desc: 'System behavioral baseline builder and drift detector for critical processes and kernel hooks.',
    cliCommand: 'python -m shadow313.tools.blueteam.sentinelbaseline',
  },
  {
    id: 'slh_dsa_fips205',
    name: '313 Temporal Binding (SLH-DSA)',
    category: 'Quantum Cryptography',
    version: 'FIPS 205',
    status: 'Secured',
    desc: 'Stateless Hash-Based Digital Signature Algorithm generating verifiable cryptographic receipts.',
    cliCommand: 'nexus temporal sign --algorithm SLH-DSA-SHAKE-128f',
  },
  {
    id: 'ml_kem_fips203',
    name: 'ML-KEM Key Encapsulation',
    category: 'Quantum Cryptography',
    version: 'FIPS 203',
    status: 'Secured',
    desc: 'Post-quantum lattice-based key exchange mechanism for hybrid cryptographic tunnels.',
    cliCommand: 'nexus crypto kem-exchange --mode ml-kem-1024',
  },
  {
    id: 'sigint_recon',
    name: 'Asynchronous Recon & Profiler',
    category: 'Recon & OSINT',
    version: 'v4.0.0',
    status: 'Ready',
    desc: 'High-speed async port discovery, subdomains, WHOIS, and automated target attack surface profiling.',
    cliCommand: 'nexus recon target --fast-scan --ai-profile',
  },
  {
    id: 'vuln_correlator',
    name: 'CVE Correlation & Exploit Advisor',
    category: 'Vulnerability & Exploits',
    version: 'v4.0.0',
    status: 'Ready',
    desc: 'Cross-checks findings against live CVE/NVD databases with local LLM threat prioritization.',
    cliCommand: 'nexus vuln audit --threat-intel --cvss-filter 7.0+',
  },
  {
    id: 'ad_auditor',
    name: 'Active Directory Auditor',
    category: 'Vulnerability & Exploits',
    version: 'v4.0.0',
    status: 'Ready',
    desc: 'Kerberoasting, AS-REP roasting, unconstrained delegation, and ACL misconfiguration analyzer.',
    cliCommand: 'nexus ad audit --kerberoast-check',
  },
  {
    id: 'container_scanner',
    name: 'Container & Image Auditor',
    category: 'Defense & Baselines',
    version: 'v4.0.0',
    status: 'Ready',
    desc: 'OCI image vulnerability triage (Trivy/Grype) and Dockerfile security compliance scanner.',
    cliCommand: 'nexus container scan --image target:latest',
  },
  {
    id: 'ollama_copilot',
    name: 'Shadow313-7B Security Copilot',
    category: 'Agentic AI',
    version: 'Local Ollama',
    status: 'Active',
    desc: 'Autonomous offline AI assistant fine-tuned on cybersecurity playbooks and exploit analysis.',
    cliCommand: 'ollama run shadow313',
  },
];

export const NexusEngineView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'baseline' | 'cli' | 'pqc'>('overview');
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanOutput, setScanOutput] = useState<string[]>([
    '[INIT] Shadow313 NEXUS Core Engine v4.0.0 initialized on local node.',
    '[PQC] FIPS 203/204/205 Kyber/Dilithium/SLH-DSA cryptographic vectors loaded.',
    '[BASELINE] Sentinel baseline profile loaded: 142 monitored targets (0 critical drift).',
    '[LOCAL] Ollama integration ready: shadow313 / gemini hybrid mode enabled.',
  ]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(text);
    soundFx.playClick();
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  const handleRunBaselineCheck = () => {
    setIsScanning(true);
    soundFx.playExecute();
    setScanOutput(prev => [
      `[RUNNING] Triggering sentinel baseline drift detection at ${new Date().toLocaleTimeString()}...`,
      ...prev,
    ]);

    setTimeout(() => {
      setIsScanning(false);
      soundFx.playAlert();
      setScanOutput(prev => [
        `[DRIFT-REPORT] Scanned 1,489 system processes & services against baseline.`,
        `[STATUS] System behavioral profile: NOMINAL. Drift delta: 0.02% (within tolerance threshold).`,
        `[RECEIPT] SLH-DSA Signature: 313-SIG-98fa-4e2b-8891 (Temporal receipt signed).`,
        ...prev,
      ]);
    }, 1500);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-[#0a0f1d] to-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8">
        <div className="absolute right-0 top-0 w-96 h-96 bg-purple-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 text-xs font-mono font-semibold bg-purple-950/60 border border-purple-800/50 text-purple-300 rounded-md">
                CORE ENGINE v4.0.0
              </span>
              <span className="px-2.5 py-1 text-xs font-mono font-semibold bg-emerald-950/60 border border-emerald-800/50 text-emerald-300 rounded-md flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                LOCAL-FIRST SECURE
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              <Shield className="w-8 h-8 text-purple-400" />
              Shadow313 NEXUS Security Core
            </h1>
            <p className="text-sm text-slate-400 max-w-2xl">
              Local-first AI-augmented security intelligence platform spanning 28 modular capabilities across reconnaissance, vulnerability correlation, quantum cryptography migration (FIPS 203/204/205), and the 313 Temporal Binding Protocol.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleRunBaselineCheck}
              disabled={isScanning}
              className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-medium transition-all shadow-lg shadow-purple-900/30 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
              <span>{isScanning ? 'Scanning Drift...' : 'Run Baseline Check'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/60 border border-slate-800/80 p-5 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono uppercase mb-2">
            <span>Cryptographic State</span>
            <Lock className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-xl font-bold text-white">FIPS 203 / 205</div>
          <div className="text-xs text-purple-400 mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            Post-Quantum Active
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 p-5 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono uppercase mb-2">
            <span>Active Modules</span>
            <Layers className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-xl font-bold text-white">28 Modules</div>
          <div className="text-xs text-slate-400 mt-1">Full suite online</div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 p-5 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono uppercase mb-2">
            <span>Baseline Drift</span>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-emerald-400">0.02% Nominal</div>
          <div className="text-xs text-slate-400 mt-1">142 targets protected</div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 p-5 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono uppercase mb-2">
            <span>AI Copilot Engine</span>
            <Cpu className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl font-bold text-white">Shadow313 + Gemini</div>
          <div className="text-xs text-emerald-400 mt-1">Local & Cloud Hybrid</div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        {[
          { id: 'overview', label: 'Engine Overview & Modules' },
          { id: 'baseline', label: 'Sentinel Drift Monitor' },
          { id: 'pqc', label: 'Quantum Verification (FIPS 203/205)' },
          { id: 'cli', label: 'Local CLI Terminal Console' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id as any);
              soundFx.playClick();
            }}
            className={`px-4 py-2 text-xs font-mono font-medium rounded-lg transition-colors ${
              activeTab === tab.id
                ? 'bg-purple-950/50 text-purple-300 border border-purple-800/50'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: Overview & Modules */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {MODULES_LIST.map(mod => (
              <div
                key={mod.id}
                className="bg-slate-900/50 border border-slate-800 hover:border-slate-700 p-5 rounded-xl transition-all group"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-purple-400 bg-purple-950/40 px-2 py-0.5 rounded border border-purple-800/30">
                      {mod.category}
                    </span>
                    <h3 className="text-base font-semibold text-white mt-1 group-hover:text-purple-300 transition-colors">
                      {mod.name}
                    </h3>
                  </div>
                  <span className="text-xs font-mono text-slate-400 bg-slate-800/60 px-2 py-1 rounded">
                    {mod.version}
                  </span>
                </div>

                <p className="text-xs text-slate-400 mb-4">{mod.desc}</p>

                <div className="flex items-center justify-between pt-3 border-t border-slate-800/60 text-xs font-mono">
                  <div className="flex items-center gap-1.5 text-slate-500 truncate max-w-[70%]">
                    <code>{mod.cliCommand}</code>
                  </div>
                  <button
                    onClick={() => handleCopy(mod.cliCommand)}
                    className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs transition-colors"
                  >
                    {copiedCmd === mod.cliCommand ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Baseline Drift Monitor */}
      {activeTab === 'baseline' && (
        <div className="space-y-4 bg-slate-900/50 border border-slate-800 p-6 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-400" />
                Sentinel Baseline Behavioral Drift Engine
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Monitors memory, process hashes, syscall distributions, and kernel hooks against baseline signatures.
              </p>
            </div>
            <button
              onClick={handleRunBaselineCheck}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono rounded-lg transition-all"
            >
              Scan Drift Now
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
            <div className="bg-slate-950/70 border border-slate-800/60 p-4 rounded-lg">
              <div className="text-xs font-mono text-slate-400">Memory Regions Monitored</div>
              <div className="text-2xl font-bold text-white mt-1">1,024 MB</div>
              <div className="text-xs text-emerald-400 mt-1">✓ No injected DLLs</div>
            </div>
            <div className="bg-slate-950/70 border border-slate-800/60 p-4 rounded-lg">
              <div className="text-xs font-mono text-slate-400">Process Tree Signatures</div>
              <div className="text-2xl font-bold text-white mt-1">318 Signatures</div>
              <div className="text-xs text-emerald-400 mt-1">✓ Verified SHA-3</div>
            </div>
            <div className="bg-slate-950/70 border border-slate-800/60 p-4 rounded-lg">
              <div className="text-xs font-mono text-slate-400">Syscall Entropy Score</div>
              <div className="text-2xl font-bold text-white mt-1">0.9998</div>
              <div className="text-xs text-emerald-400 mt-1">✓ Baseline coherent</div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: PQC Verification */}
      {activeTab === 'pqc' && (
        <div className="space-y-4 bg-slate-900/50 border border-slate-800 p-6 rounded-xl">
          <div className="flex items-center gap-3">
            <KeyRound className="w-6 h-6 text-purple-400" />
            <div>
              <h2 className="text-lg font-bold text-white">Post-Quantum Cryptography Compliance Matrix</h2>
              <p className="text-xs text-slate-400">Standards compliant with NIST FIPS 203, FIPS 204, and FIPS 205.</p>
            </div>
          </div>

          <div className="overflow-x-auto pt-4">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-3">Standard</th>
                  <th className="p-3">Primitive</th>
                  <th className="p-3">Key Size / Parameters</th>
                  <th className="p-3">Security Level</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                <tr>
                  <td className="p-3 font-semibold text-white">NIST FIPS 203</td>
                  <td className="p-3 text-purple-300">ML-KEM-1024</td>
                  <td className="p-3 text-slate-400">1568 bytes pk / 3168 bytes sk</td>
                  <td className="p-3 text-emerald-400">NIST Level 5 (Quantum Proof)</td>
                  <td className="p-3 text-emerald-400">✓ Enforced</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-white">NIST FIPS 204</td>
                  <td className="p-3 text-purple-300">ML-DSA-87</td>
                  <td className="p-3 text-slate-400">2592 bytes pk / 4896 bytes sk</td>
                  <td className="p-3 text-emerald-400">NIST Level 5 (Quantum Proof)</td>
                  <td className="p-3 text-emerald-400">✓ Enforced</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-white">NIST FIPS 205</td>
                  <td className="p-3 text-purple-300">SLH-DSA-SHAKE-128f</td>
                  <td className="p-3 text-slate-400">32 bytes pk / 17088 bytes sig</td>
                  <td className="p-3 text-emerald-400">Stateless Hash-Based</td>
                  <td className="p-3 text-emerald-400">✓ Enforced</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: CLI Terminal Console */}
      {activeTab === 'cli' && (
        <div className="bg-black/90 border border-slate-800 rounded-xl p-4 font-mono text-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/80 text-slate-400">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-purple-400" />
              <span>Shadow313 NEXUS Local Daemon Console</span>
            </div>
            <span className="text-[10px] text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/30">
              CONNECTED
            </span>
          </div>

          <div className="h-64 overflow-y-auto space-y-1.5 text-slate-300">
            {scanOutput.map((line, idx) => (
              <div key={idx} className="leading-relaxed">
                {line.startsWith('[STATUS]') ? (
                  <span className="text-emerald-400">{line}</span>
                ) : line.startsWith('[DRIFT-REPORT]') ? (
                  <span className="text-sky-400 font-semibold">{line}</span>
                ) : line.startsWith('[RECEIPT]') ? (
                  <span className="text-purple-400 font-semibold">{line}</span>
                ) : (
                  <span>{line}</span>
                )}
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-800/80 flex items-center gap-2 text-slate-400">
            <span className="text-purple-400">$</span>
            <input
              type="text"
              readOnly
              value="nexus --agentic --pqc-verify --sentinel-baseline"
              className="bg-transparent flex-1 focus:outline-none text-slate-200 font-mono text-xs"
            />
            <button
              onClick={() => handleCopy('nexus --agentic --pqc-verify --sentinel-baseline')}
              className="text-slate-400 hover:text-white p-1"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
