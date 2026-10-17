import React, { useState } from 'react';
import { Eraser, Trash2, ShieldAlert, Check, Copy, RefreshCw, Lock, Download, FileSpreadsheet } from 'lucide-react';
import { soundFx } from '../../utils/audio';

const SAMPLE_DIRTY_LOG = `[2026-04-12T14:18:02.102Z] [AUTH] Failed password for root from 198.51.100.42 port 52218 ssh2
[2026-04-12T14:18:05.419Z] [C2_LINK] Beacon sent to master.ghost-c2.net:8443 with key=sk_live_99827a44b91f09e2
[2026-04-12T14:18:09.882Z] [SDR] Tuned ADALM-Pluto to 2485000000 Hz, hardware gain=42dB
[2026-04-12T14:18:14.001Z] [SESSION] Token Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.t-ID leaked in headers
[2026-04-12T14:18:22.310Z] [NETWORK] Target probe 10.0.4.12:443 established socket fd=7`;

// Shannon entropy calculation (bits per byte, 0 - 8)
function calculateShannonEntropy(str: string): number {
  if (!str) return 0;
  const len = str.length;
  const frequencies: Record<string, number> = {};
  for (let i = 0; i < len; i++) {
    const ch = str[i];
    frequencies[ch] = (frequencies[ch] || 0) + 1;
  }
  let entropy = 0;
  for (const ch in frequencies) {
    const p = frequencies[ch] / len;
    entropy -= p * Math.log2(p);
  }
  return +entropy.toFixed(3);
}

function escapeCsvCell(cell: string | number): string {
  const str = String(cell ?? '');
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function convertLogToCsv(rawText: string, currentMode: string): string {
  const lines = rawText.split(/\r?\n/).filter(line => line.trim().length > 0);
  const headers = ['Line', 'Timestamp', 'Subsystem', 'Scrub_State', 'Line_Entropy', 'Sanitized_Message'];

  const rows = lines.map((line, index) => {
    let timestamp = '';
    let subsystem = '';
    let message = line;

    // Check bracketed format: [timestamp] [tag] message
    const bracketMatch = line.match(/^\[([^\]]+)\](?:\s*\[([^\]]+)\])?\s*(.*)$/);
    if (bracketMatch) {
      timestamp = bracketMatch[1];
      subsystem = bracketMatch[2] || 'SYSTEM';
      message = bracketMatch[3];
    } else {
      // Check if it's zero-filled or hex-overwritten
      if (/^([0-9a-fA-F]{2}\s*)+$/.test(line.trim())) {
        subsystem = 'RAW_BUFFER';
      }
    }

    const lineEntropy = calculateShannonEntropy(line);
    const scrubState = currentMode === 'zero_fill'
      ? 'ZERO_FILLED'
      : currentMode === 'crypto_overwrite'
      ? 'CRYPTO_OVERWRITE'
      : (line.includes('[REDACTED_') || line.includes('[CRYPTO_KEY_') || line.includes('[DOMAIN_') || line.includes('[TIMESTAMP_'))
      ? 'INDICATORS_STRIPPED'
      : 'CLEAN';

    return [
      index + 1,
      timestamp || 'N/A',
      subsystem || 'GENERAL',
      scrubState,
      lineEntropy.toFixed(3),
      message
    ].map(escapeCsvCell).join(',');
  });

  return [headers.join(','), ...rows].join('\r\n');
}

export const LogScrubber: React.FC = () => {
  const [logText, setLogText] = useState(SAMPLE_DIRTY_LOG);
  const [scrubMode, setScrubMode] = useState<'regex' | 'zero_fill' | 'crypto_overwrite'>('regex');
  const [redactedCount, setRedactedCount] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  const initialEntropy = calculateShannonEntropy(SAMPLE_DIRTY_LOG);
  const currentEntropy = calculateShannonEntropy(logText);

  const handleScrub = () => {
    soundFx.playAlert();

    if (scrubMode === 'zero_fill') {
      // Overwrite all characters with 0x00 representation or zero blocks
      const zeroString = '00 '.repeat(logText.length).trim();
      setLogText(zeroString);
      setRedactedCount(logText.length);
    } else if (scrubMode === 'crypto_overwrite') {
      // Overwrite with cryptographically pseudo-random bytes
      const hexChars = '0123456789ABCDEF';
      let randomHex = '';
      for (let i = 0; i < logText.length; i++) {
        randomHex += hexChars[Math.floor(Math.random() * 16)];
        if ((i + 1) % 2 === 0) randomHex += ' ';
      }
      setLogText(randomHex.trim());
      setRedactedCount(logText.length);
    } else {
      // Forensic RegEx Scrub: IP addresses, domains, tokens, keys, timestamps
      let text = logText;
      let count = 0;

      // Scrub IPv4 addresses
      const ipRegex = /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g;
      const ipMatches = text.match(ipRegex);
      if (ipMatches) {
        count += ipMatches.length;
        text = text.replace(ipRegex, '[REDACTED_IPV4]');
      }

      // Scrub API keys (sk_..., token=...)
      const keyRegex = /(key=|Bearer |token=)[a-zA-Z0-9_\-\.]{10,}/g;
      const keyMatches = text.match(keyRegex);
      if (keyMatches) {
        count += keyMatches.length;
        text = text.replace(keyRegex, '$1[CRYPTO_KEY_PURGED]');
      }

      // Scrub C2 domains
      const domainRegex = /\b([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}\b/gi;
      const domainMatches = text.match(domainRegex);
      if (domainMatches) {
        count += domainMatches.length;
        text = text.replace(domainRegex, '[DOMAIN_MASKED]');
      }

      // Scrub ISO timestamps
      const tsRegex = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/g;
      const tsMatches = text.match(tsRegex);
      if (tsMatches) {
        count += tsMatches.length;
        text = text.replace(tsRegex, '[TIMESTAMP_ZEROED]');
      }

      setLogText(text);
      setRedactedCount(count);
    }
  };

  const handleReset = () => {
    soundFx.playClick();
    setLogText(SAMPLE_DIRTY_LOG);
    setRedactedCount(null);
  };

  const handleCopy = () => {
    soundFx.playClick();
    navigator.clipboard.writeText(logText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadCsv = () => {
    soundFx.playExecute();
    const csvContent = convertLogToCsv(logText, scrubMode);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `sanitized_log_${scrubMode}_${timestamp}.csv`;

    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 2500);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#1e293b]">
        <div>
          <h2 className="text-sm font-bold tracking-widest text-[#f0f6fc] uppercase terminal-text flex items-center gap-2">
            <Eraser className="w-4 h-4 text-sky-400" />
            Active Log Scrubber & Forensic Purge Core
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Zero-fill memory buffer sanitization, pseudo-random overwrite, and automated forensic indicator redaction with structured CSV export.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/30 text-rose-400 terminal-text font-bold flex items-center gap-1">
            <Lock className="w-3 h-3" />
            ANTI-FORENSIC PROTOCOL
          </span>
        </div>
      </div>

      {/* Scrub Mode Selectors */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <button
          onClick={() => {
            soundFx.playClick();
            setScrubMode('regex');
          }}
          className={`p-3 rounded-lg border text-left transition-all ${
            scrubMode === 'regex'
              ? 'bg-sky-500/15 border-sky-500/50 text-sky-300 shadow-[0_0_12px_rgba(56,189,248,0.15)]'
              : 'bg-[#0f1117] border-[#1e293b] text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="text-xs font-bold font-mono">1. Forensic Heuristic Filter</div>
          <div className="text-[11px] text-slate-500 mt-1">
            Preserves log structure while stripping IPs, API keys, tokens, and domain IOCs.
          </div>
        </button>

        <button
          onClick={() => {
            soundFx.playClick();
            setScrubMode('zero_fill');
          }}
          className={`p-3 rounded-lg border text-left transition-all ${
            scrubMode === 'zero_fill'
              ? 'bg-amber-500/15 border-amber-500/50 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.15)]'
              : 'bg-[#0f1117] border-[#1e293b] text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="text-xs font-bold font-mono">2. Zero-Fill Overwrite (0x00)</div>
          <div className="text-[11px] text-slate-500 mt-1">
            Completely replaces target memory with null-byte buffers (Entropy drops to 0.00).
          </div>
        </button>

        <button
          onClick={() => {
            soundFx.playClick();
            setScrubMode('crypto_overwrite');
          }}
          className={`p-3 rounded-lg border text-left transition-all ${
            scrubMode === 'crypto_overwrite'
              ? 'bg-rose-500/15 border-rose-500/50 text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.15)]'
              : 'bg-[#0f1117] border-[#1e293b] text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="text-xs font-bold font-mono">3. DoD Multi-Pass Pseudo-Random</div>
          <div className="text-[11px] text-slate-500 mt-1">
            Overwrites buffer with high-entropy cryptographic noise to defeat flash recovery.
          </div>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-lg bg-[#0f1117] border border-[#1e293b]">
          <span className="text-[10px] text-slate-500 uppercase font-mono">Current Entropy</span>
          <p className="text-sm font-bold text-sky-400 font-mono mt-0.5">{currentEntropy} bits/byte</p>
        </div>
        <div className="p-3 rounded-lg bg-[#0f1117] border border-[#1e293b]">
          <span className="text-[10px] text-slate-500 uppercase font-mono">Initial Entropy</span>
          <p className="text-sm font-bold text-slate-400 font-mono mt-0.5">{initialEntropy} bits/byte</p>
        </div>
        <div className="p-3 rounded-lg bg-[#0f1117] border border-[#1e293b]">
          <span className="text-[10px] text-slate-500 uppercase font-mono">Buffer Length</span>
          <p className="text-sm font-bold text-slate-200 font-mono mt-0.5">{logText.length} Chars</p>
        </div>
        <div className="p-3 rounded-lg bg-[#0f1117] border border-[#1e293b]">
          <span className="text-[10px] text-slate-500 uppercase font-mono">IOCs Stripped</span>
          <p className="text-sm font-bold text-emerald-400 font-mono mt-0.5">
            {redactedCount !== null ? `${redactedCount} Indicators` : 'Awaiting Execution'}
          </p>
        </div>
      </div>

      {/* Log Buffer Area */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="font-mono">Active Target Buffer Stream:</span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadCsv}
              title="Download current sanitized buffer as structured CSV"
              className="text-xs px-2.5 py-1 rounded bg-sky-500/15 border border-sky-500/40 text-sky-300 hover:bg-sky-500/25 flex items-center gap-1.5 transition-colors font-mono"
            >
              {downloaded ? <Check className="w-3 h-3 text-emerald-400" /> : <Download className="w-3 h-3 text-sky-400" />}
              <span>{downloaded ? 'Downloaded CSV' : 'Export CSV'}</span>
            </button>
            <button
              onClick={handleCopy}
              className="text-xs px-2.5 py-1 rounded bg-[#161b22] border border-[#30363d] text-slate-300 hover:text-sky-300 flex items-center gap-1 transition-colors"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
            <button
              onClick={handleReset}
              className="text-xs px-2.5 py-1 rounded bg-[#161b22] border border-[#30363d] text-slate-400 hover:text-slate-200 flex items-center gap-1 transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        <textarea
          value={logText}
          onChange={e => setLogText(e.target.value)}
          className="w-full h-44 bg-[#010409] border border-[#30363d] rounded-lg p-3 text-xs font-mono text-sky-300 focus:outline-none focus:border-sky-400 leading-relaxed resize-y"
        />

        <div className="flex flex-wrap items-center gap-3 mt-1">
          <button
            onClick={handleScrub}
            className="px-5 py-2.5 rounded-lg bg-rose-500/20 border border-rose-500/60 text-rose-300 text-xs font-bold hover:bg-rose-500/30 transition-all flex items-center gap-2 shadow-[0_0_14px_rgba(244,63,94,0.2)]"
          >
            <Trash2 className="w-4 h-4" />
            Execute Anti-Forensic Scrub Pass
          </button>

          <button
            onClick={handleDownloadCsv}
            className="px-4 py-2.5 rounded-lg bg-[#161b22] border border-sky-500/50 text-sky-300 text-xs font-bold hover:bg-sky-500/20 transition-all flex items-center gap-2 shadow-[0_0_10px_rgba(56,189,248,0.12)] font-mono"
          >
            <FileSpreadsheet className="w-4 h-4 text-sky-400" />
            <span>Download Structured CSV Export</span>
          </button>

          <span className="text-[10px] text-slate-500 font-mono hidden sm:inline">
            Schema: Line, Timestamp, Subsystem, Scrub_State, Line_Entropy, Sanitized_Message
          </span>
        </div>
      </div>
    </div>
  );
};
