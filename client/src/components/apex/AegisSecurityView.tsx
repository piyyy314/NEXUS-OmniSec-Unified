import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  Terminal, 
  RefreshCw, 
  Key, 
  Flame, 
  Lock, 
  Cpu, 
  FileText, 
  Download, 
  Copy, 
  Check, 
  Radio, 
  AlertCircle,
  EyeOff
} from 'lucide-react';
import { CREATIONS_ARCHIVE } from '../data/creationsData';
import { SocLogEvent, HoneypotHit, FimRecord, AnomalyRecord } from '../types';

interface AegisSecurityViewProps {
  pqcKeysCount: number;
  onIncrementPqcKey: () => void;
  blockedThreatsCount: number;
  onIncrementBlockedThreat: () => void;
}

export const AegisSecurityView: React.FC<AegisSecurityViewProps> = ({
  pqcKeysCount,
  onIncrementPqcKey,
  blockedThreatsCount,
  onIncrementBlockedThreat
}) => {
  const [logs, setLogs] = useState<SocLogEvent[]>([
    {
      id: '1',
      timestamp: '13:50:02',
      type: 'INFO',
      message: 'AEGIS Ultimate Autonomous Defense Engine initialized.',
      source: 'Orchestrator',
      severity: 'low'
    },
    {
      id: '2',
      timestamp: '13:50:05',
      type: 'INFO',
      message: 'Active Defense Honeypot listening on fake SSH port 2222.',
      source: 'DeceptionModule',
      severity: 'low'
    },
    {
      id: '3',
      timestamp: '13:50:11',
      type: 'INFO',
      message: 'File Integrity Monitor baseline established for /etc/modem.conf.',
      source: 'FIM-Subsystem',
      severity: 'low'
    }
  ]);

  const [honeypotHits, setHoneypotHits] = useState<HoneypotHit[]>([
    { id: 'hp-1', time: '13:51:20', ip: '198.51.100.42', port: 2222, service: 'Fake-OpenSSH', action: 'BLOCKED' },
    { id: 'hp-2', time: '13:52:14', ip: '203.0.113.88', port: 2222, service: 'Fake-OpenSSH', action: 'BLOCKED' }
  ]);

  const [fimEvents, setFimEvents] = useState<FimRecord[]>([
    {
      id: 'fim-1',
      time: '13:50:12',
      file: 'aegis_secure_vault/critical_config.txt',
      action: 'BASELINE_LOCKED',
      oldHash: 'a94a8fe5ccb19ba61c4c0873d391e987982fbbd3',
      newHash: 'a94a8fe5ccb19ba61c4c0873d391e987982fbbd3'
    }
  ]);

  const [anomalies, setAnomalies] = useState<AnomalyRecord[]>([
    { id: 'anom-1', time: '13:51:40', packetSize: 4950, durationMs: 980, anomalyScore: -0.84, status: 'FLAGGED' },
    { id: 'anom-2', time: '13:52:45', packetSize: 5200, durationMs: 1100, anomalyScore: -0.91, status: 'ISOLATED' }
  ]);

  const [counterMeasureLevel, setCounterMeasureLevel] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME'>('HIGH');
  const [copiedCode, setCopiedCode] = useState(false);
  const [isSimulatingTamper, setIsSimulatingTamper] = useState(false);

  const aegisArtifact = CREATIONS_ARCHIVE.find(a => a.id === 'aegis-security');

  const addLog = (type: SocLogEvent['type'], message: string, source: string, severity: SocLogEvent['severity']) => {
    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0];
    const newEvent: SocLogEvent = {
      id: Math.random().toString(36).substring(7),
      timestamp: timeStr,
      type,
      message,
      source,
      severity
    };
    setLogs(prev => [newEvent, ...prev.slice(0, 30)]);
  };

  // Trigger Honeypot Hit Simulation
  const handleSimulateHoneypotHit = () => {
    const randomIp = `${Math.floor(Math.random() * 200 + 20)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 250 + 1)}`;
    const now = new Date().toTimeString().split(' ')[0];
    const hit: HoneypotHit = {
      id: Math.random().toString(),
      time: now,
      ip: randomIp,
      port: 2222,
      service: 'Fake-OpenSSH',
      action: 'BLOCKED'
    };
    setHoneypotHits(prev => [hit, ...prev.slice(0, 6)]);
    onIncrementBlockedThreat();
    addLog('BLOCK', `Intruder trapped by Honeypot on port 2222. Source: ${randomIp}. Iptables DROP rule synthesized.`, 'ActiveDefense', 'high');
  };

  // Trigger File Tampering & Self-Healing
  const handleSimulateTamperAndHeal = () => {
    setIsSimulatingTamper(true);
    const now = new Date().toTimeString().split(' ')[0];
    const fakeTamperedHash = Math.random().toString(36).substring(2, 18);
    
    addLog('ALERT', 'CRITICAL INTEGRITY BREACH: critical_config.txt SHA-256 hash mismatch detected!', 'FIM-Watcher', 'critical');

    setTimeout(() => {
      const fimRecord: FimRecord = {
        id: Math.random().toString(),
        time: now,
        file: 'aegis_secure_vault/critical_config.txt',
        action: 'RESTORED',
        oldHash: fakeTamperedHash,
        newHash: 'a94a8fe5ccb19ba61c4c0873d391e987982fbbd3'
      };
      setFimEvents(prev => [fimRecord, ...prev.slice(0, 5)]);
      addLog('RESTORE', 'Self-Healing Activated: Restored critical_config.txt from secure cryptographic backup vault.', 'SelfHealingEngine', 'medium');
      setIsSimulatingTamper(false);
    }, 1200);
  };

  // Trigger ML Anomaly detection
  const handleSimulateMlAnomaly = () => {
    const size = Math.floor(Math.random() * 4000 + 2000);
    const duration = Math.floor(Math.random() * 1200 + 400);
    const score = Number((-0.5 - Math.random() * 0.45).toFixed(2));
    const now = new Date().toTimeString().split(' ')[0];
    
    const rec: AnomalyRecord = {
      id: Math.random().toString(),
      time: now,
      packetSize: size,
      durationMs: duration,
      anomalyScore: score,
      status: 'FLAGGED'
    };
    setAnomalies(prev => [rec, ...prev.slice(0, 5)]);
    onIncrementBlockedThreat();
    addLog('ALERT', `IsolationForest flagged abnormal traffic vector: size=${size}B, duration=${duration}ms (Score=${score}).`, 'ML-Anomaly', 'high');
  };

  // Rotate PQC Keys
  const handleRotatePqc = () => {
    onIncrementPqcKey();
    addLog('PQC', 'Rotated Post-Quantum CRYSTALS-Kyber-1024 session keypair. Ephemeral ciphertext encapsulated.', 'QuantumCrypto', 'low');
  };

  const handleDownloadApp = () => {
    if (!aegisArtifact) return;
    const blob = new Blob([aegisArtifact.code], { type: 'text/x-python;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'aegis_app.py';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      
      {/* Banner */}
      <div className="rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-cyan-950/40 via-slate-900/60 to-slate-900/80 p-6 glow-cyan">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-1 rounded-md bg-cyan-500/20 text-cyan-400 font-mono text-xs border border-cyan-500/30 font-semibold">
                AUTONOMOUS DEFENSE PLATFORM
              </span>
              <span className="text-xs text-slate-400 font-mono">ASYNCIO &bull; SCIKIT-LEARN &bull; ACTIVE HONEYPOT &bull; PQC</span>
            </div>
            <h2 className="text-2xl font-bold text-white mt-2 flex items-center gap-2">
              <ShieldAlert className="h-6 w-6 text-cyan-400" />
              Project AEGIS Ultimate - Live SOC Command Hub
            </h2>
            <p className="text-sm text-slate-300 max-w-3xl mt-1">
              Real-time operational dashboard integrating automated machine learning intrusion detection, 
              self-healing configuration restoration, deceptive active honeypot traps, and Post-Quantum cryptographic sessions.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleDownloadApp}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition shadow-lg shadow-cyan-500/20"
            >
              <Download className="h-4 w-4" />
              <span>Download aegis_app.py</span>
            </button>
          </div>
        </div>
      </div>

      {/* Control Action Center */}
      <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/80">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Radio className="h-4 w-4 text-cyan-400 animate-pulse" />
            Interactive Simulation Triggers (Test Defenses In-Memory)
          </span>
          <div className="flex items-center space-x-2 text-xs">
            <span className="text-slate-400">Counter-Offensive Posture:</span>
            <div className="flex rounded-lg border border-slate-800 bg-slate-950 p-0.5">
              {(['LOW', 'MEDIUM', 'HIGH', 'EXTREME'] as const).map(level => (
                <button
                  key={level}
                  onClick={() => {
                    setCounterMeasureLevel(level);
                    addLog('INFO', `Counter-Offensive level reconfigured to ${level}.`, 'PolicyEngine', 'medium');
                  }}
                  className={`px-2.5 py-1 text-[11px] font-mono rounded-md font-semibold transition ${
                    counterMeasureLevel === level
                      ? level === 'EXTREME'
                        ? 'bg-rose-600 text-white'
                        : 'bg-cyan-600 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <button
            onClick={handleSimulateHoneypotHit}
            className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-rose-500/50 hover:bg-rose-950/20 text-slate-200 text-xs font-medium transition group"
          >
            <div className="flex items-center space-x-2">
              <EyeOff className="h-4 w-4 text-rose-400 group-hover:scale-110 transition" />
              <span>Trip Port 2222 Honeypot</span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">Auto-Ban</span>
          </button>

          <button
            onClick={handleSimulateTamperAndHeal}
            disabled={isSimulatingTamper}
            className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-emerald-500/50 hover:bg-emerald-950/20 text-slate-200 text-xs font-medium transition group disabled:opacity-50"
          >
            <div className="flex items-center space-x-2">
              <RefreshCw className={`h-4 w-4 text-emerald-400 group-hover:scale-110 transition ${isSimulatingTamper ? 'animate-spin' : ''}`} />
              <span>Tamper &amp; Self-Heal File</span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">FIM SHA256</span>
          </button>

          <button
            onClick={handleSimulateMlAnomaly}
            className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-500/50 hover:bg-amber-950/20 text-slate-200 text-xs font-medium transition group"
          >
            <div className="flex items-center space-x-2">
              <Flame className="h-4 w-4 text-amber-400 group-hover:scale-110 transition" />
              <span>Inject Traffic Anomaly</span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">IsolationForest</span>
          </button>

          <button
            onClick={handleRotatePqc}
            className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-cyan-500/50 hover:bg-cyan-950/20 text-slate-200 text-xs font-medium transition group"
          >
            <div className="flex items-center space-x-2">
              <Key className="h-4 w-4 text-cyan-400 group-hover:scale-110 transition" />
              <span>Rotate PQC Kyber Key</span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">Lattice Crypto</span>
          </button>
        </div>
      </div>

      {/* Main SOC Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Live Terminal Operations Log */}
        <div className="lg:col-span-2 rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs flex flex-col h-[520px]">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
            <div className="flex items-center space-x-2">
              <Terminal className="h-4 w-4 text-emerald-400" />
              <span className="text-slate-200 font-semibold">AEGIS Real-time Event Stream</span>
            </div>
            <span className="text-[10px] text-slate-500">Live async event loop (refresh=4Hz)</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-2">
            {logs.map((log) => {
              const colorClass = 
                log.severity === 'critical' ? 'text-rose-400 border-l-2 border-rose-500 pl-2' :
                log.severity === 'high' ? 'text-amber-400 border-l-2 border-amber-500 pl-2' :
                log.severity === 'medium' ? 'text-cyan-400 border-l-2 border-cyan-500 pl-2' :
                'text-slate-300 border-l-2 border-slate-700 pl-2';

              return (
                <div key={log.id} className={`text-[11px] leading-relaxed ${colorClass}`}>
                  <span className="text-slate-500">[{log.timestamp}]</span>{' '}
                  <span className="text-slate-400 font-bold">[{log.source}]</span>{' '}
                  <span className="font-semibold">{log.type}:</span>{' '}
                  {log.message}
                </div>
              );
            })}
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
            <span>Subsystems: <span className="text-emerald-400">FIM</span> &bull; <span className="text-cyan-400">PQC</span> &bull; <span className="text-amber-400">ML</span> &bull; <span className="text-rose-400">HONEYPOT</span></span>
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
              SOC LIVE
            </span>
          </div>
        </div>

        {/* Right Col: Honeypot & Anomaly Tables */}
        <div className="space-y-4">
          
          {/* Honeypot Table */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-semibold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                <AlertCircle className="h-3.5 w-3.5" />
                Active Honeypot Hits (Port 2222)
              </h4>
              <span className="text-[10px] font-mono text-slate-500">{honeypotHits.length} trapped</span>
            </div>

            <div className="space-y-2 max-h-[160px] overflow-y-auto">
              {honeypotHits.map(hit => (
                <div key={hit.id} className="p-2 rounded-lg bg-slate-950 border border-slate-800/80 flex items-center justify-between text-xs font-mono">
                  <div>
                    <div className="text-slate-200">{hit.ip}</div>
                    <div className="text-[10px] text-slate-500">{hit.time} &bull; {hit.service}</div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold">
                    {hit.action}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* AI/ML Anomaly Table */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Cpu className="h-3.5 w-3.5" />
                ML Anomaly Detections (IsolationForest)
              </h4>
              <span className="text-[10px] font-mono text-slate-500">{anomalies.length} outliers</span>
            </div>

            <div className="space-y-2 max-h-[160px] overflow-y-auto">
              {anomalies.map(anom => (
                <div key={anom.id} className="p-2 rounded-lg bg-slate-950 border border-slate-800/80 flex items-center justify-between text-xs font-mono">
                  <div>
                    <div className="text-slate-200">{anom.packetSize}B &bull; {anom.durationMs}ms</div>
                    <div className="text-[10px] text-slate-500">{anom.time} &bull; Score: {anom.anomalyScore}</div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold">
                    {anom.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* FIM Restorations */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <RefreshCw className="h-3.5 w-3.5" />
                Self-Healing FIM Records
              </h4>
              <span className="text-[10px] font-mono text-slate-500">{fimEvents.length} events</span>
            </div>

            <div className="space-y-2 max-h-[140px] overflow-y-auto">
              {fimEvents.map(fim => (
                <div key={fim.id} className="p-2 rounded-lg bg-slate-950 border border-slate-800/80 text-xs font-mono">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300 truncate max-w-[180px]">{fim.file.split('/').pop()}</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold">
                      {fim.action}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1 truncate">Hash: {fim.newHash}</div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
