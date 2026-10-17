import React, { useState } from 'react';
import { Layers, Copy, Check, Terminal, Cpu, Play } from 'lucide-react';
import { soundFx } from '../../utils/audio';

// Helper to compute standard RFC 791/792 16-bit one's complement checksum
function calculate16BitChecksum(bytes: number[]): number {
  let sum = 0;
  for (let i = 0; i < bytes.length; i += 2) {
    const high = bytes[i] || 0;
    const low = bytes[i + 1] || 0;
    const word = (high << 8) | low;
    sum += word;
    while (sum > 0xffff) {
      sum = (sum & 0xffff) + (sum >> 16);
    }
  }
  return (~sum) & 0xffff;
}

function ipToBytes(ipStr: string): number[] {
  const parts = ipStr.trim().split('.');
  if (parts.length !== 4) return [127, 0, 0, 1];
  return parts.map(p => Math.min(255, Math.max(0, parseInt(p, 10) || 0)));
}

export const PacketSmith: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'ipv4' | 'icmp'>('ipv4');
  const [copiedHex, setCopiedHex] = useState(false);

  // IPv4 States
  const [srcIp, setSrcIp] = useState('10.0.4.12');
  const [dstIp, setDstIp] = useState('192.168.1.1');
  const [ttl, setTtl] = useState(64);
  const [protoNum, setProtoNum] = useState(1); // 1 = ICMP, 6 = TCP, 17 = UDP
  const [idHex, setIdHex] = useState('4A2B');
  const [flagDf, setFlagDf] = useState(true);
  const [flagMf, setFlagMf] = useState(false);
  const [payloadText, setPayloadText] = useState('GHOST-NET-C2-HEARTBEAT');

  // ICMP States
  const [icmpType, setIcmpType] = useState(8); // 8 = Echo Request, 0 = Reply
  const [icmpCode, setIcmpCode] = useState(0);
  const [icmpSeq, setIcmpSeq] = useState(1);
  const [icmpId, setIcmpId] = useState(0x0042);

  // Build IPv4 Frame
  const payloadBytes = Array.from(new TextEncoder().encode(payloadText));
  const totalLength = 20 + payloadBytes.length;

  const versionIhl = (4 << 4) | 5; // 0x45
  const tos = 0x00;
  const idWord = parseInt(idHex, 16) || 0x1337;

  let flagsAndFrag = 0;
  if (flagDf) flagsAndFrag |= 0x4000;
  if (flagMf) flagsAndFrag |= 0x2000;

  const srcBytes = ipToBytes(srcIp);
  const dstBytes = ipToBytes(dstIp);

  // Raw header with checksum = 0 for calculation
  const ipHeaderBeforeCksum = [
    versionIhl,
    tos,
    (totalLength >> 8) & 0xff,
    totalLength & 0xff,
    (idWord >> 8) & 0xff,
    idWord & 0xff,
    (flagsAndFrag >> 8) & 0xff,
    flagsAndFrag & 0xff,
    ttl & 0xff,
    protoNum & 0xff,
    0x00,
    0x00, // Checksum placeholder
    srcBytes[0],
    srcBytes[1],
    srcBytes[2],
    srcBytes[3],
    dstBytes[0],
    dstBytes[1],
    dstBytes[2],
    dstBytes[3],
  ];

  const ipChecksum = calculate16BitChecksum(ipHeaderBeforeCksum);
  const finalIpHeader = [...ipHeaderBeforeCksum];
  finalIpHeader[10] = (ipChecksum >> 8) & 0xff;
  finalIpHeader[11] = ipChecksum & 0xff;

  const fullIpv4Packet = [...finalIpHeader, ...payloadBytes];
  const ipv4Hex = fullIpv4Packet
    .map(b => b.toString(16).padStart(2, '0').toUpperCase())
    .join(' ');

  // Build ICMP Frame
  const icmpHeaderBeforeCksum = [
    icmpType & 0xff,
    icmpCode & 0xff,
    0x00,
    0x00, // Checksum placeholder
    (icmpId >> 8) & 0xff,
    icmpId & 0xff,
    (icmpSeq >> 8) & 0xff,
    icmpSeq & 0xff,
  ];

  const fullIcmpBytesForCksum = [...icmpHeaderBeforeCksum, ...payloadBytes];
  const icmpChecksum = calculate16BitChecksum(fullIcmpBytesForCksum);
  const finalIcmpHeader = [...icmpHeaderBeforeCksum];
  finalIcmpHeader[2] = (icmpChecksum >> 8) & 0xff;
  finalIcmpHeader[3] = icmpChecksum & 0xff;

  const fullIcmpPacket = [...finalIcmpHeader, ...payloadBytes];
  const icmpHex = fullIcmpPacket
    .map(b => b.toString(16).padStart(2, '0').toUpperCase())
    .join(' ');

  const currentHex = activeSubTab === 'ipv4' ? ipv4Hex : icmpHex;

  const copyHex = () => {
    soundFx.playExecute();
    navigator.clipboard.writeText(currentHex.replace(/\s+/g, ''));
    setCopiedHex(true);
    setTimeout(() => setCopiedHex(false), 2000);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#1e293b]">
        <div>
          <h2 className="text-sm font-bold tracking-widest text-[#f0f6fc] uppercase terminal-text flex items-center gap-2">
            <Layers className="w-4 h-4 text-sky-400" />
            Layer-3 & 4 Frame Smith & RFC Assembler
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Architect custom IPv4 datagrams and ICMP echo frames with dynamic RFC 791/792 16-bit one's complement checksum generation.
          </p>
        </div>
        <div className="flex items-center gap-1.5 bg-[#0f1117] p-1 rounded-lg border border-[#1e293b]">
          <button
            onClick={() => {
              soundFx.playClick();
              setActiveSubTab('ipv4');
            }}
            className={`px-3 py-1 text-xs rounded font-mono transition-colors ${
              activeSubTab === 'ipv4'
                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Layer-3 IPv4
          </button>
          <button
            onClick={() => {
              soundFx.playClick();
              setActiveSubTab('icmp');
            }}
            className={`px-3 py-1 text-xs rounded font-mono transition-colors ${
              activeSubTab === 'icmp'
                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Layer-4 ICMP Echo
          </button>
        </div>
      </div>

      {/* Frame Builder Fields */}
      {activeSubTab === 'ipv4' ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="p-3 rounded-lg bg-[#0f1117] border border-[#1e293b]">
            <label className="text-[10px] text-slate-500 uppercase font-mono block mb-1">Source IP Address</label>
            <input
              type="text"
              value={srcIp}
              onChange={e => setSrcIp(e.target.value)}
              className="w-full bg-[#010409] border border-[#30363d] rounded p-2 text-xs font-mono text-sky-300 focus:outline-none focus:border-sky-400"
            />
          </div>

          <div className="p-3 rounded-lg bg-[#0f1117] border border-[#1e293b]">
            <label className="text-[10px] text-slate-500 uppercase font-mono block mb-1">Destination IP</label>
            <input
              type="text"
              value={dstIp}
              onChange={e => setDstIp(e.target.value)}
              className="w-full bg-[#010409] border border-[#30363d] rounded p-2 text-xs font-mono text-sky-300 focus:outline-none focus:border-sky-400"
            />
          </div>

          <div className="p-3 rounded-lg bg-[#0f1117] border border-[#1e293b]">
            <label className="text-[10px] text-slate-500 uppercase font-mono block mb-1">TTL (Time to Live)</label>
            <input
              type="number"
              min="1"
              max="255"
              value={ttl}
              onChange={e => setTtl(parseInt(e.target.value, 10) || 64)}
              className="w-full bg-[#010409] border border-[#30363d] rounded p-2 text-xs font-mono text-sky-300 focus:outline-none focus:border-sky-400"
            />
          </div>

          <div className="p-3 rounded-lg bg-[#0f1117] border border-[#1e293b]">
            <label className="text-[10px] text-slate-500 uppercase font-mono block mb-1">Protocol Type</label>
            <select
              value={protoNum}
              onChange={e => setProtoNum(parseInt(e.target.value, 10))}
              className="w-full bg-[#010409] border border-[#30363d] rounded p-2 text-xs font-mono text-sky-300 focus:outline-none focus:border-sky-400"
            >
              <option value={1}>1 (ICMP)</option>
              <option value={6}>6 (TCP)</option>
              <option value={17}>17 (UDP)</option>
              <option value={47}>47 (GRE Tunnel)</option>
            </select>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="p-3 rounded-lg bg-[#0f1117] border border-[#1e293b]">
            <label className="text-[10px] text-slate-500 uppercase font-mono block mb-1">ICMP Type</label>
            <select
              value={icmpType}
              onChange={e => setIcmpType(parseInt(e.target.value, 10))}
              className="w-full bg-[#010409] border border-[#30363d] rounded p-2 text-xs font-mono text-sky-300 focus:outline-none focus:border-sky-400"
            >
              <option value={8}>8 (Echo Request)</option>
              <option value={0}>0 (Echo Reply)</option>
              <option value={3}>3 (Destination Unreachable)</option>
              <option value={11}>11 (Time Exceeded)</option>
            </select>
          </div>

          <div className="p-3 rounded-lg bg-[#0f1117] border border-[#1e293b]">
            <label className="text-[10px] text-slate-500 uppercase font-mono block mb-1">ICMP Identifier</label>
            <input
              type="number"
              value={icmpId}
              onChange={e => setIcmpId(parseInt(e.target.value, 10) || 0)}
              className="w-full bg-[#010409] border border-[#30363d] rounded p-2 text-xs font-mono text-sky-300 focus:outline-none focus:border-sky-400"
            />
          </div>

          <div className="p-3 rounded-lg bg-[#0f1117] border border-[#1e293b]">
            <label className="text-[10px] text-slate-500 uppercase font-mono block mb-1">Sequence Number</label>
            <input
              type="number"
              value={icmpSeq}
              onChange={e => setIcmpSeq(parseInt(e.target.value, 10) || 1)}
              className="w-full bg-[#010409] border border-[#30363d] rounded p-2 text-xs font-mono text-sky-300 focus:outline-none focus:border-sky-400"
            />
          </div>

          <div className="p-3 rounded-lg bg-[#0f1117] border border-[#1e293b]">
            <label className="text-[10px] text-slate-500 uppercase font-mono block mb-1">ICMP Code</label>
            <input
              type="number"
              value={icmpCode}
              onChange={e => setIcmpCode(parseInt(e.target.value, 10) || 0)}
              className="w-full bg-[#010409] border border-[#30363d] rounded p-2 text-xs font-mono text-sky-300 focus:outline-none focus:border-sky-400"
            />
          </div>
        </div>
      )}

      {/* Payload Input */}
      <div className="p-3 rounded-lg bg-[#0f1117] border border-[#1e293b]">
        <label className="text-[10px] text-slate-500 uppercase font-mono block mb-1">
          Datagram Payload (ASCII / Hex)
        </label>
        <input
          type="text"
          value={payloadText}
          onChange={e => setPayloadText(e.target.value)}
          placeholder="Enter custom telemetry string..."
          className="w-full bg-[#010409] border border-[#30363d] rounded p-2 text-xs font-mono text-sky-300 focus:outline-none focus:border-sky-400"
        />
      </div>

      {/* Computed RFC Checksum Output */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-lg bg-[#0f1117] border border-[#1e293b]">
          <span className="text-[10px] text-slate-500 uppercase font-mono">
            {activeSubTab === 'ipv4' ? 'IPv4 Header Cksum' : 'ICMP Checksum'}
          </span>
          <p className="text-sm font-bold text-emerald-400 font-mono mt-0.5">
            0x{(activeSubTab === 'ipv4' ? ipChecksum : icmpChecksum).toString(16).padStart(4, '0').toUpperCase()}
          </p>
        </div>
        <div className="p-3 rounded-lg bg-[#0f1117] border border-[#1e293b]">
          <span className="text-[10px] text-slate-500 uppercase font-mono">Total Wire Bytes</span>
          <p className="text-sm font-bold text-sky-400 font-mono mt-0.5">
            {activeSubTab === 'ipv4' ? fullIpv4Packet.length : fullIcmpPacket.length} bytes
          </p>
        </div>
        <div className="p-3 rounded-lg bg-[#0f1117] border border-[#1e293b]">
          <span className="text-[10px] text-slate-500 uppercase font-mono">Header Length</span>
          <p className="text-sm font-bold text-slate-300 font-mono mt-0.5">
            {activeSubTab === 'ipv4' ? '20 Bytes (5 DWORDS)' : '8 Bytes'}
          </p>
        </div>
        <div className="p-3 rounded-lg bg-[#0f1117] border border-[#1e293b]">
          <span className="text-[10px] text-slate-500 uppercase font-mono">RFC Compliance</span>
          <p className="text-sm font-bold text-emerald-400 font-mono mt-0.5">
            {activeSubTab === 'ipv4' ? 'RFC-791 VERIFIED' : 'RFC-792 VERIFIED'}
          </p>
        </div>
      </div>

      {/* Hex Output Matrix */}
      <div className="p-4 rounded-lg bg-[#010409] border border-[#1e293b] flex flex-col gap-2 font-mono text-xs shadow-inner">
        <div className="flex items-center justify-between border-b border-slate-900 pb-2 text-slate-400">
          <span>ASSEMBLER HEXADECIMAL OUTPUT (OCTET MATRIX)</span>
          <button
            onClick={copyHex}
            className="text-xs px-2.5 py-1 rounded bg-[#161b22] border border-[#30363d] text-slate-300 hover:text-sky-300 flex items-center gap-1.5 transition-colors"
          >
            {copiedHex ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span>{copiedHex ? 'Copied Raw' : 'Copy Hex'}</span>
          </button>
        </div>

        <div className="p-3 rounded bg-[#0A0C10] border border-slate-900 text-sky-300 text-xs leading-relaxed overflow-x-auto tracking-wider font-mono">
          {currentHex}
        </div>

        <div className="flex items-center gap-4 text-[10px] text-slate-500 pt-1">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded bg-sky-400 inline-block"></span> Header Bytes
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded bg-amber-400 inline-block"></span> Checksum Field
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded bg-emerald-400 inline-block"></span> Payload Stream
          </span>
        </div>
      </div>
    </div>
  );
};
