import React, { useState } from 'react';
import { Radio, Play, RefreshCw, Copy, Check, Info } from 'lucide-react';
import { soundFx } from '../../utils/audio';

const SAMPLE_DNS_PACKETS = [
  {
    name: 'Standard Query (google.com A)',
    hex: '241A0100000100000000000006676F6F676C6503636F6D0000010001',
    description: 'TxID: 0x241A, Query for A Record of google.com',
  },
  {
    name: 'Response (google.com A -> 142.250.190.46)',
    hex: '241A8180000100010000000006676F6F676C6503636F6D0000010001C00C000100010000012C00048EFA BE2E',
    description: 'TxID: 0x241A, Answers: 1 (IPv4: 142.250.190.46), TTL: 300s',
  },
  {
    name: 'SatCom C2 Telemetry Query (gw.telstar.net)',
    hex: 'B00F012000010000000000000267770774656C73746172036E65740000100001',
    description: 'TxID: 0xB00F, TXT query for gw.telstar.net beacon',
  },
  {
    name: 'Reverse Pointer PTR Query (1.1.1.1.in-addr.arpa)',
    hex: '77A101000001000000000000013101310131013107696E2D61646472046172706100000C0001',
    description: 'TxID: 0x77A1, Reverse DNS lookup for 1.1.1.1',
  },
];

export const DnsInterceptor: React.FC = () => {
  const [rawInput, setRawInput] = useState(SAMPLE_DNS_PACKETS[0].hex);
  const [parsedData, setParsedData] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleParse = (hexString: string = rawInput) => {
    soundFx.playExecute();
    setErrorMsg(null);
    const cleaned = hexString.replace(/[^0-9a-fA-F]/g, '');

    if (cleaned.length < 24) {
      setErrorMsg('Invalid payload depth. Minimum DNS RFC-1035 structure requires at least a 12-byte header (24 hex characters).');
      setParsedData(null);
      return;
    }

    try {
      const transactionId = cleaned.slice(0, 4).toUpperCase();
      const flagsField = parseInt(cleaned.slice(4, 8), 16);
      const qdCount = parseInt(cleaned.slice(8, 12), 16);
      const anCount = parseInt(cleaned.slice(12, 16), 16);
      const nsCount = parseInt(cleaned.slice(16, 20), 16);
      const arCount = parseInt(cleaned.slice(20, 24), 16);

      const isResponse = (flagsField & 0x8000) !== 0;
      const opCode = (flagsField >> 11) & 0x000F;
      const opCodeNames = ['Standard Query (QUERY)', 'Inverse Query (IQUERY)', 'Server Status (STATUS)', 'Notify', 'Update'];
      const opCodeStr = opCodeNames[opCode] || `OPCODE_${opCode}`;

      const authoritative = (flagsField & 0x0400) !== 0;
      const truncated = (flagsField & 0x0200) !== 0;
      const recursionDesired = (flagsField & 0x0100) !== 0;
      const recursionAvailable = (flagsField & 0x0080) !== 0;

      const rCode = flagsField & 0x000F;
      const rCodeMap: Record<number, string> = {
        0: 'NOERROR (Success)',
        1: 'FORMERR (Format Error)',
        2: 'SERVFAIL (Server Failure)',
        3: 'NXDOMAIN (Non-Existent Domain)',
        4: 'NOTIMP (Not Implemented)',
        5: 'REFUSED (Query Refused)',
      };
      const rCodeStr = rCodeMap[rCode] || `CODE_${rCode}`;

      // Parse question labels starting at byte offset 12 (hex index 24)
      let offset = 24;
      const domainLabels: string[] = [];
      let reachedEnd = false;

      while (offset < cleaned.length && !reachedEnd) {
        const lengthByte = parseInt(cleaned.slice(offset, offset + 2), 16);
        if (lengthByte === 0) {
          offset += 2;
          reachedEnd = true;
          break;
        }

        // Pointer compression check (0xC0 prefix)
        if ((lengthByte & 0xC0) === 0xC0) {
          domainLabels.push('[PTR_COMPRESSED]');
          offset += 4;
          reachedEnd = true;
          break;
        }

        offset += 2;
        let label = '';
        for (let i = 0; i < lengthByte; i++) {
          if (offset + 2 <= cleaned.length) {
            const charCode = parseInt(cleaned.slice(offset, offset + 2), 16);
            label += String.fromCharCode(charCode);
            offset += 2;
          }
        }
        domainLabels.push(label);
      }

      const domain = domainLabels.join('.') || '<root>';
      const qTypeHex = cleaned.slice(offset, offset + 4).toUpperCase();
      const qClassHex = cleaned.slice(offset + 4, offset + 8).toUpperCase();

      const qTypeMap: Record<string, string> = {
        '0001': 'A (Host Address)',
        '0002': 'NS (Authoritative Name Server)',
        '0005': 'CNAME (Canonical Name)',
        '000C': 'PTR (Domain Name Pointer)',
        '000F': 'MX (Mail Exchange)',
        '0010': 'TXT (Text Strings)',
        '001C': 'AAAA (IPv6 Host Address)',
        '00FF': 'ANY (All Cached Records)',
      };

      const qClassMap: Record<string, string> = {
        '0001': 'IN (Internet / RFC 1035)',
        '0003': 'CH (Chaosnet)',
        '0004': 'HS (Hesiod)',
        '00FF': 'ANY (Any Class)',
      };

      setParsedData({
        transactionId,
        rawFlagsHex: '0x' + cleaned.slice(4, 8).toUpperCase(),
        isResponse,
        opCodeStr,
        authoritative,
        truncated,
        recursionDesired,
        recursionAvailable,
        rCodeStr,
        qdCount,
        anCount,
        nsCount,
        arCount,
        domain,
        qTypeStr: qTypeMap[qTypeHex] || `TYPE_0x${qTypeHex}`,
        qClassStr: qClassMap[qClassHex] || `CLASS_0x${qClassHex}`,
        totalBytes: cleaned.length / 2,
        headerHex: cleaned.slice(0, 24).toUpperCase(),
        payloadHex: cleaned.slice(24).toUpperCase(),
      });
    } catch (e: any) {
      setErrorMsg('Parser Exception: ' + e.message);
      setParsedData(null);
    }
  };

  const copyResults = () => {
    if (!parsedData) return;
    const summary = `[SIGINT DNS DECONSTRUCTION]
TxID: 0x${parsedData.transactionId}
QR: ${parsedData.isResponse ? 'RESPONSE' : 'QUERY'}
OpCode: ${parsedData.opCodeStr}
Status: ${parsedData.rCodeStr}
Questions: ${parsedData.qdCount}
Answers: ${parsedData.anCount}
Domain: ${parsedData.domain}
Type: ${parsedData.qTypeStr}
Class: ${parsedData.qClassStr}`;
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Module Title Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#1e293b]">
        <div>
          <h2 className="text-sm font-bold tracking-widest text-[#f0f6fc] uppercase terminal-text flex items-center gap-2">
            <Radio className="w-4 h-4 text-sky-400" />
            SIGINT DNS Interceptor & Traffic Parser
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time RFC-1035 frame disassembler for DNS tunneling detection, beacon telemetry, and payload inspection.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] px-2 py-0.5 rounded bg-sky-500/10 border border-sky-500/30 text-sky-400 terminal-text font-bold">
            RFC-1035 COMPLIANT
          </span>
        </div>
      </div>

      {/* Preset Quick Load */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider terminal-text shrink-0">
          Presets:
        </span>
        {SAMPLE_DNS_PACKETS.map((preset, idx) => (
          <button
            key={idx}
            onClick={() => {
              soundFx.playClick();
              setRawInput(preset.hex);
              handleParse(preset.hex);
            }}
            className="px-2.5 py-1 rounded text-xs bg-[#161b22] border border-[#30363d] text-slate-300 hover:text-sky-300 hover:border-sky-500/40 shrink-0 transition-colors"
          >
            {preset.name}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold text-slate-400 flex items-center justify-between">
          <span>Raw Hexadecimal DNS Traffic Stream:</span>
          <span className="text-[10px] text-slate-500 font-mono">
            Length: {rawInput.replace(/[^0-9a-fA-F]/g, '').length / 2} bytes
          </span>
        </label>
        <textarea
          value={rawInput}
          onChange={e => setRawInput(e.target.value)}
          placeholder="Paste raw packet hex (e.g. 241A010000010000...)"
          className="w-full h-24 bg-[#010409] border border-[#30363d] rounded-lg p-3 text-xs font-mono text-sky-300 focus:outline-none focus:border-sky-400 transition-colors resize-y"
        />
        <div className="flex items-center gap-2 mt-1">
          <button
            onClick={() => handleParse()}
            className="px-4 py-2 rounded-lg bg-sky-500/20 border border-sky-500/50 text-sky-300 text-xs font-bold hover:bg-sky-500/30 transition-all flex items-center gap-2 shadow-[0_0_12px_rgba(56,189,248,0.15)]"
          >
            <Play className="w-3.5 h-3.5" />
            Dissect Packet Stream
          </button>
          <button
            onClick={() => {
              soundFx.playClick();
              setRawInput('');
              setParsedData(null);
              setErrorMsg(null);
            }}
            className="px-3 py-2 rounded-lg bg-[#161b22] border border-[#30363d] text-slate-400 hover:text-slate-200 text-xs transition-colors flex items-center gap-1.5"
          >
            <RefreshCw className="w-3 h-3" />
            Clear
          </button>
        </div>
      </div>

      {/* Error display */}
      {errorMsg && (
        <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800/80 text-rose-300 text-xs terminal-text flex items-start gap-2">
          <Info className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Analysis Output Results */}
      {parsedData && (
        <div className="flex flex-col gap-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 terminal-text">
              Signal Intelligence Attributes Breakdown
            </h3>
            <button
              onClick={copyResults}
              className="text-xs px-2.5 py-1 rounded bg-[#161b22] border border-[#30363d] text-slate-300 hover:text-sky-300 flex items-center gap-1.5 transition-colors"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? 'Copied' : 'Copy Analysis'}</span>
            </button>
          </div>

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-lg bg-[#0f1117] border border-[#1e293b]">
              <span className="text-[10px] text-slate-500 uppercase font-mono">Transaction ID</span>
              <p className="text-sm font-bold text-sky-400 font-mono mt-0.5">0x{parsedData.transactionId}</p>
            </div>
            <div className="p-3 rounded-lg bg-[#0f1117] border border-[#1e293b]">
              <span className="text-[10px] text-slate-500 uppercase font-mono">Mode Class</span>
              <p
                className={`text-sm font-bold font-mono mt-0.5 ${
                  parsedData.isResponse ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                {parsedData.isResponse ? 'RESPONSE' : 'QUERY'}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-[#0f1117] border border-[#1e293b]">
              <span className="text-[10px] text-slate-500 uppercase font-mono">RCODE Status</span>
              <p className="text-sm font-bold text-slate-200 font-mono mt-0.5 truncate" title={parsedData.rCodeStr}>
                {parsedData.rCodeStr.split(' ')[0]}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-[#0f1117] border border-[#1e293b]">
              <span className="text-[10px] text-slate-500 uppercase font-mono">Total Length</span>
              <p className="text-sm font-bold text-slate-300 font-mono mt-0.5">{parsedData.totalBytes} Bytes</p>
            </div>
          </div>

          {/* Detailed Deconstruction Box */}
          <div className="p-4 rounded-lg bg-[#010409] border border-[#1e293b] font-mono text-xs text-sky-300 flex flex-col gap-1.5 shadow-inner">
            <div className="flex justify-between border-b border-slate-900 pb-2 mb-2 text-slate-500 text-[11px]">
              <span>[RFC-1035 HEADER & QUESTION FIELD MAP]</span>
              <span className="text-emerald-400">STATUS: VERIFIED DECODE</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1.5 text-xs">
              <div className="flex justify-between py-0.5 border-b border-slate-900/60">
                <span className="text-slate-400">• Transaction ID:</span>
                <span className="text-sky-400 font-bold">0x{parsedData.transactionId}</span>
              </div>
              <div className="flex justify-between py-0.5 border-b border-slate-900/60">
                <span className="text-slate-400">• Operational Code:</span>
                <span className="text-slate-200">{parsedData.opCodeStr}</span>
              </div>
              <div className="flex justify-between py-0.5 border-b border-slate-900/60">
                <span className="text-slate-400">• Questions Count:</span>
                <span className="text-slate-200">{parsedData.qdCount}</span>
              </div>
              <div className="flex justify-between py-0.5 border-b border-slate-900/60">
                <span className="text-slate-400">• Answer Records:</span>
                <span className="text-slate-200">{parsedData.anCount}</span>
              </div>
              <div className="flex justify-between py-0.5 border-b border-slate-900/60">
                <span className="text-slate-400">• Recursion Desired:</span>
                <span className={parsedData.recursionDesired ? 'text-emerald-400' : 'text-slate-500'}>
                  {parsedData.recursionDesired ? 'YES (1)' : 'NO (0)'}
                </span>
              </div>
              <div className="flex justify-between py-0.5 border-b border-slate-900/60">
                <span className="text-slate-400">• Truncation (TC):</span>
                <span className={parsedData.truncated ? 'text-rose-400' : 'text-slate-500'}>
                  {parsedData.truncated ? 'YES (Truncated)' : 'NO'}
                </span>
              </div>
              <div className="flex justify-between py-0.5 border-b border-slate-900/60 col-span-1 md:col-span-2">
                <span className="text-slate-400">• Extracted Target Domain:</span>
                <span className="text-amber-300 font-bold tracking-wide font-mono select-all">"{parsedData.domain}"</span>
              </div>
              <div className="flex justify-between py-0.5 border-b border-slate-900/60">
                <span className="text-slate-400">• Resolved Record Type:</span>
                <span className="text-emerald-300 font-semibold">{parsedData.qTypeStr}</span>
              </div>
              <div className="flex justify-between py-0.5 border-b border-slate-900/60">
                <span className="text-slate-400">• Protocol Class:</span>
                <span className="text-slate-300">{parsedData.qClassStr}</span>
              </div>
            </div>

            {/* Hex Separation Preview */}
            <div className="mt-3 pt-3 border-t border-slate-800/80 text-[11px]">
              <span className="text-slate-500 block mb-1">Byte Partition Map:</span>
              <div className="p-2.5 rounded bg-[#0A0C10] border border-slate-900 overflow-x-auto text-[11px] leading-relaxed">
                <span className="text-sky-400 font-bold" title="12-byte DNS Header">
                  {parsedData.headerHex.match(/.{1,2}/g)?.join(' ')}
                </span>{' '}
                <span className="text-amber-400 font-bold" title="Question Payload & Domain">
                  {parsedData.payloadHex.match(/.{1,2}/g)?.join(' ')}
                </span>
              </div>
              <div className="flex items-center gap-4 mt-1.5 text-[10px] text-slate-500">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded bg-sky-400 inline-block"></span>
                  Header (12 bytes)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded bg-amber-400 inline-block"></span>
                  Query Body & Name
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
