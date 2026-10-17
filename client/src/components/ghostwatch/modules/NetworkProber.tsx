import React, { useState } from 'react';
import { Compass, Play, RefreshCw, CheckCircle2, XCircle, Clock, Globe } from 'lucide-react';
import { soundFx } from '../../utils/audio';

interface ProbeTarget {
  port: number;
  service: string;
  protocol: string;
  status: 'OPEN' | 'FILTERED' | 'CLOSED' | 'PROBING';
  latencyMs?: number;
  info: string;
}

const DEFAULT_TARGETS: ProbeTarget[] = [
  { port: 22, service: 'SSH Management', protocol: 'TCP', status: 'FILTERED', latencyMs: 142, info: 'Drop policy active' },
  { port: 53, service: 'DNS Resolver', protocol: 'UDP', status: 'OPEN', latencyMs: 18, info: 'RFC 1035 UDP listener' },
  { port: 80, service: 'HTTP Web Server', protocol: 'TCP', status: 'OPEN', latencyMs: 32, info: '301 Moved Permanently' },
  { port: 443, service: 'HTTPS Secure Socket', protocol: 'TCP', status: 'OPEN', latencyMs: 24, info: 'TLS 1.3 / Kyber-512' },
  { port: 8443, service: 'C2 Control Beacon', protocol: 'TCP/WSS', status: 'OPEN', latencyMs: 12, info: 'Encrypted telemetry uplink' },
  { port: 3389, service: 'MS RDP Terminal', protocol: 'TCP', status: 'CLOSED', latencyMs: 4, info: 'RST received' },
];

export const NetworkProber: React.FC = () => {
  const [targetHost, setTargetHost] = useState('gw-relay-9982.net');
  const [targets, setTargets] = useState<ProbeTarget[]>(DEFAULT_TARGETS);
  const [isProbing, setIsProbing] = useState(false);

  const startProbe = () => {
    soundFx.playExecute();
    setIsProbing(true);

    // Set all to probing
    setTargets(prev => prev.map(t => ({ ...t, status: 'PROBING' as const })));

    let completed = 0;
    targets.forEach((target, index) => {
      setTimeout(() => {
        const simulatedLatency = Math.floor(Math.random() * 45) + 8;
        const possibleStatuses: ('OPEN' | 'FILTERED' | 'CLOSED')[] = ['OPEN', 'OPEN', 'FILTERED', 'CLOSED'];
        const newStatus = target.port === 443 || target.port === 8443 || target.port === 53
          ? 'OPEN'
          : possibleStatuses[Math.floor(Math.random() * possibleStatuses.length)];

        setTargets(current => {
          const updated = [...current];
          updated[index] = {
            ...updated[index],
            status: newStatus,
            latencyMs: simulatedLatency,
          };
          return updated;
        });

        completed++;
        if (completed === targets.length) {
          setIsProbing(false);
          soundFx.playClick();
        }
      }, (index + 1) * 350);
    });
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#1e293b]">
        <div>
          <h2 className="text-sm font-bold tracking-widest text-[#f0f6fc] uppercase terminal-text flex items-center gap-2">
            <Compass className="w-4 h-4 text-sky-400" />
            Network State & WebSocket Port Prober
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Non-destructive service latency and firewall filtering probe for operational relay endpoints.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] px-2 py-0.5 rounded bg-sky-500/10 border border-sky-500/30 text-sky-400 terminal-text font-bold">
            SOCKET PROBE READY
          </span>
        </div>
      </div>

      {/* Target input */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-3 rounded-lg bg-[#0f1117] border border-[#1e293b]">
        <div className="flex-1 flex items-center gap-2 bg-[#010409] border border-[#30363d] rounded px-3 py-2">
          <Globe className="w-4 h-4 text-slate-500 shrink-0" />
          <input
            type="text"
            value={targetHost}
            onChange={e => setTargetHost(e.target.value)}
            placeholder="Enter hostname or IP..."
            className="w-full bg-transparent text-xs font-mono text-sky-300 focus:outline-none"
          />
        </div>

        <button
          onClick={startProbe}
          disabled={isProbing}
          className="px-5 py-2.5 rounded bg-sky-500/20 border border-sky-500/50 text-sky-300 text-xs font-bold hover:bg-sky-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-[0_0_12px_rgba(56,189,248,0.15)]"
        >
          {isProbing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
          <span>{isProbing ? 'Probing Ports...' : 'Launch Matrix Probe'}</span>
        </button>
      </div>

      {/* Ports Matrix Table */}
      <div className="border border-[#1e293b] rounded-lg bg-[#0A0C10] overflow-hidden">
        <div className="grid grid-cols-12 px-4 py-2.5 bg-[#0f1117] border-b border-[#1e293b] text-[10px] font-mono uppercase text-slate-500 font-bold">
          <div className="col-span-2">Port / Proto</div>
          <div className="col-span-3">Service Name</div>
          <div className="col-span-3">State</div>
          <div className="col-span-2">Latency</div>
          <div className="col-span-2 text-right">Diagnostic</div>
        </div>

        <div className="divide-y divide-[#1e293b]/60">
          {targets.map(target => (
            <div
              key={target.port}
              className="grid grid-cols-12 px-4 py-3 text-xs font-mono items-center hover:bg-slate-900/40 transition-colors"
            >
              <div className="col-span-2 text-sky-300 font-bold">
                {target.port} <span className="text-slate-500 text-[10px]">/{target.protocol}</span>
              </div>
              <div className="col-span-3 text-slate-300 truncate">
                {target.service}
              </div>
              <div className="col-span-3 flex items-center gap-1.5">
                {target.status === 'PROBING' ? (
                  <span className="text-sky-400 flex items-center gap-1 text-[11px]">
                    <RefreshCw className="w-3 h-3 animate-spin" /> Probing...
                  </span>
                ) : target.status === 'OPEN' ? (
                  <span className="text-emerald-400 flex items-center gap-1 text-[11px] font-bold">
                    <CheckCircle2 className="w-3 h-3" /> OPEN
                  </span>
                ) : target.status === 'FILTERED' ? (
                  <span className="text-amber-400 flex items-center gap-1 text-[11px]">
                    <Clock className="w-3 h-3" /> FILTERED
                  </span>
                ) : (
                  <span className="text-slate-500 flex items-center gap-1 text-[11px]">
                    <XCircle className="w-3 h-3" /> CLOSED
                  </span>
                )}
              </div>
              <div className="col-span-2 text-slate-400">
                {target.status === 'PROBING' ? '---' : `${target.latencyMs} ms`}
              </div>
              <div className="col-span-2 text-right text-[11px] text-slate-500 truncate" title={target.info}>
                {target.info}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
