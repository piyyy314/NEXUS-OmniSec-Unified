import React, { useState } from 'react';
import { FileSearch, Upload, FileCode, Check, RefreshCw } from 'lucide-react';
import { soundFx } from '../../utils/audio';

interface FileSignature {
  name: string;
  bytes: number[];
  mask?: number[];
  type: string;
  ext: string;
}

const SIGNATURES: FileSignature[] = [
  { name: 'ELF Executable (Linux Binary)', bytes: [0x7F, 0x45, 0x4C, 0x46], type: 'application/x-executable', ext: 'elf' },
  { name: 'PE / Portable Executable (Windows EXE/DLL)', bytes: [0x4D, 0x5A], type: 'application/x-dosexec', ext: 'exe' },
  { name: 'PDF Document', bytes: [0x25, 0x50, 0x44, 0x46], type: 'application/pdf', ext: 'pdf' },
  { name: 'PCAP Packet Capture', bytes: [0xD4, 0xC3, 0xB2, 0xA1], type: 'application/vnd.tcpdump.pcap', ext: 'pcap' },
  { name: 'PCAP-NG Packet Capture', bytes: [0x0A, 0x0D, 0x0D, 0x0A], type: 'application/x-pcapng', ext: 'pcapng' },
  { name: 'PNG Image', bytes: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A], type: 'image/png', ext: 'png' },
  { name: 'ZIP Archive / DOCX / APK', bytes: [0x50, 0x4B, 0x03, 0x04], type: 'application/zip', ext: 'zip' },
  { name: 'GZIP Compressed Stream', bytes: [0x1F, 0x8B], type: 'application/gzip', ext: 'gz' },
  { name: 'SQLite 3 Database', bytes: [0x53, 0x51, 0x4C, 0x69, 0x74, 0x65, 0x20, 0x66, 0x6F, 0x72, 0x6D, 0x61, 0x74, 0x20, 0x33, 0x00], type: 'application/vnd.sqlite3', ext: 'sqlite' },
];

const PRESET_FILES = [
  {
    name: 'sample_daemon.elf',
    bytes: [
      0x7F, 0x45, 0x4C, 0x46, 0x02, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x02, 0x00, 0x3E, 0x00, 0x01, 0x00, 0x00, 0x00, 0x60, 0x10, 0x40, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x40, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x88, 0x2E, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x40, 0x00, 0x38, 0x00, 0x09, 0x00, 0x40, 0x00, 0x1E, 0x00, 0x1D, 0x00,
    ],
  },
  {
    name: 'network_intercept.pcap',
    bytes: [
      0xD4, 0xC3, 0xB2, 0xA1, 0x02, 0x00, 0x04, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0xFF, 0xFF, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x58, 0x42, 0x99, 0x69, 0x2A, 0x0A, 0x04, 0x00,
      0x3C, 0x00, 0x00, 0x00, 0x3C, 0x00, 0x00, 0x00, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0x00, 0x0C,
      0x29, 0x8A, 0xB1, 0x24, 0x08, 0x00, 0x45, 0x00, 0x00, 0x28, 0x1A, 0x2B, 0x40, 0x00, 0x40, 0x06,
    ],
  },
  {
    name: 'payload_spec.pdf',
    bytes: [
      0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E, 0x37, 0x0A, 0x25, 0xE2, 0xE3, 0xCF, 0xD3, 0x0A, 0x31,
      0x20, 0x30, 0x20, 0x6F, 0x62, 0x6A, 0x0A, 0x3C, 0x3C, 0x2F, 0x54, 0x79, 0x70, 0x65, 0x20, 0x2F,
      0x43, 0x61, 0x74, 0x61, 0x6C, 0x6F, 0x67, 0x2F, 0x50, 0x61, 0x67, 0x65, 0x73, 0x20, 0x32, 0x20,
      0x30, 0x20, 0x52, 0x3E, 0x3E, 0x0A, 0x65, 0x6E, 0x64, 0x6F, 0x62, 0x6A, 0x0A, 0x32, 0x20, 0x30,
    ],
  },
];

export const FileExtractor: React.FC = () => {
  const [currentBytes, setCurrentBytes] = useState<number[]>(PRESET_FILES[0].bytes);
  const [fileName, setFileName] = useState<string>(PRESET_FILES[0].name);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    soundFx.playExecute();
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result instanceof ArrayBuffer) {
        const arr = new Uint8Array(reader.result.slice(0, 256));
        setCurrentBytes(Array.from(arr));
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Match signature
  const matchedSig = SIGNATURES.find(sig => {
    return sig.bytes.every((b, i) => currentBytes[i] === b);
  });

  // Render hexdump lines (16 bytes per line)
  const lines: { offset: string; hex: string[]; ascii: string }[] = [];
  for (let i = 0; i < currentBytes.length; i += 16) {
    const chunk = currentBytes.slice(i, i + 16);
    const offset = i.toString(16).padStart(8, '0').toUpperCase();
    const hex = chunk.map(b => b.toString(16).padStart(2, '0').toUpperCase());
    const ascii = chunk
      .map(b => (b >= 32 && b <= 126 ? String.fromCharCode(b) : '.'))
      .join('');
    lines.push({ offset, hex, ascii });
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#1e293b]">
        <div>
          <h2 className="text-sm font-bold tracking-widest text-[#f0f6fc] uppercase terminal-text flex items-center gap-2">
            <FileSearch className="w-4 h-4 text-sky-400" />
            Local File Magic Byte & Header Extractor
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Inspect binary file headers, decode magic numbers, and verify true MIME container identities with xxd-style hexdump.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs px-3 py-1.5 rounded-lg bg-sky-500/20 border border-sky-500/50 text-sky-300 font-bold hover:bg-sky-500/30 cursor-pointer transition-colors flex items-center gap-1.5 shadow-[0_0_12px_rgba(56,189,248,0.15)]">
            <Upload className="w-3.5 h-3.5" />
            <span>Upload File</span>
            <input type="file" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>
      </div>

      {/* Preset Buttons */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider terminal-text shrink-0">
          Load Sample:
        </span>
        {PRESET_FILES.map((preset, idx) => (
          <button
            key={idx}
            onClick={() => {
              soundFx.playClick();
              setFileName(preset.name);
              setCurrentBytes(preset.bytes);
            }}
            className="px-2.5 py-1 rounded text-xs bg-[#161b22] border border-[#30363d] text-slate-300 hover:text-sky-300 hover:border-sky-500/40 shrink-0 transition-colors"
          >
            {preset.name}
          </button>
        ))}
      </div>

      {/* File Info Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3 rounded-lg bg-[#0f1117] border border-[#1e293b]">
          <span className="text-[10px] text-slate-500 uppercase font-mono">Target File</span>
          <p className="text-xs font-bold text-sky-400 font-mono mt-0.5 truncate">{fileName}</p>
        </div>
        <div className="p-3 rounded-lg bg-[#0f1117] border border-[#1e293b]">
          <span className="text-[10px] text-slate-500 uppercase font-mono">Identified Format</span>
          <p className="text-xs font-bold text-emerald-400 font-mono mt-0.5 truncate">
            {matchedSig ? matchedSig.name : 'Unknown Binary / Custom Stream'}
          </p>
        </div>
        <div className="p-3 rounded-lg bg-[#0f1117] border border-[#1e293b]">
          <span className="text-[10px] text-slate-500 uppercase font-mono">MIME Type</span>
          <p className="text-xs font-bold text-slate-300 font-mono mt-0.5 truncate">
            {matchedSig ? matchedSig.type : 'application/octet-stream'}
          </p>
        </div>
      </div>

      {/* Hex Dump Container */}
      <div className="p-4 rounded-lg bg-[#010409] border border-[#1e293b] flex flex-col gap-2 font-mono text-xs shadow-inner">
        <div className="flex items-center justify-between border-b border-slate-900 pb-2 text-slate-500 text-[11px]">
          <span>HEX DUMP (OFFSET | HEX BYTES | ASCII)</span>
          <span className="text-sky-400">{currentBytes.length} BYTES LOADED</span>
        </div>

        <div className="divide-y divide-slate-900/60 overflow-x-auto text-[11px] leading-relaxed">
          {lines.map((line, idx) => (
            <div key={idx} className="flex items-center gap-4 py-1 hover:bg-slate-900/30">
              {/* Offset */}
              <span className="text-slate-600 font-bold shrink-0">{line.offset}:</span>

              {/* Hex bytes (grouped by 8) */}
              <div className="flex gap-2 text-sky-300 shrink-0 font-mono">
                <span className="tracking-wider">{line.hex.slice(0, 8).join(' ')}</span>
                <span className="text-slate-700">|</span>
                <span className="tracking-wider">{line.hex.slice(8, 16).join(' ')}</span>
              </div>

              {/* ASCII preview */}
              <span className="text-amber-300/80 tracking-widest pl-3 border-l border-slate-800 shrink-0 select-none">
                {line.ascii}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
