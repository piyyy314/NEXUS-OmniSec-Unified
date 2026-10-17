import React, { useState } from 'react';
import { Code2, Copy, Check, Download, RefreshCw } from 'lucide-react';
import { soundFx } from '../../utils/audio';

type TargetLang = 'c' | 'python' | 'javascript' | 'rust' | 'golang';

export const ArrayFormatter: React.FC = () => {
  const [inputText, setInputText] = useState('GHOST-WATCH-EXPLOIT-PAYLOAD-2026');
  const [lang, setLang] = useState<TargetLang>('c');
  const [isHexInput, setIsHexInput] = useState(false);
  const [varName, setVarName] = useState('beacon_shellcode');
  const [copied, setCopied] = useState(false);

  // Convert input into bytes
  let bytes: number[] = [];
  if (isHexInput) {
    const cleaned = inputText.replace(/[^0-9a-fA-F]/g, '');
    for (let i = 0; i < cleaned.length; i += 2) {
      bytes.push(parseInt(cleaned.substr(i, 2), 16));
    }
  } else {
    bytes = Array.from(new TextEncoder().encode(inputText));
  }

  // Format code based on language
  const generateCode = (): string => {
    const hexArray = bytes.map(b => '0x' + b.toString(16).padStart(2, '0').toUpperCase());

    switch (lang) {
      case 'c': {
        const rows: string[] = [];
        for (let i = 0; i < hexArray.length; i += 12) {
          rows.push('    ' + hexArray.slice(i, i + 12).join(', '));
        }
        return `// C / C++ Shellcode Array Structure
unsigned char ${varName}[] = {
${rows.join(',\n')}
};
unsigned int ${varName}_len = ${bytes.length};`;
      }

      case 'python': {
        const escaped = bytes.map(b => '\\x' + b.toString(16).padStart(2, '0').toLowerCase()).join('');
        return `# Python 3 Bytes Object
${varName} = b"${escaped}"
${varName}_len = len(${varName}) # ${bytes.length} bytes`;
      }

      case 'javascript': {
        const rows: string[] = [];
        for (let i = 0; i < hexArray.length; i += 12) {
          rows.push('  ' + hexArray.slice(i, i + 12).join(', '));
        }
        return `// JavaScript / TypeScript TypedArray
export const ${varName} = new Uint8Array([
${rows.join(',\n')}
]);
export const ${varName}Length = ${bytes.length};`;
      }

      case 'rust': {
        const rows: string[] = [];
        for (let i = 0; i < hexArray.length; i += 12) {
          rows.push('    ' + hexArray.slice(i, i + 12).join(', '));
        }
        return `// Rust Static Slice
pub const ${varName.toUpperCase()}: &[u8] = &[
${rows.join(',\n')}
];
pub const ${varName.toUpperCase()}_LEN: usize = ${bytes.length};`;
      }

      case 'golang': {
        const rows: string[] = [];
        for (let i = 0; i < hexArray.length; i += 12) {
          rows.push('\t' + hexArray.slice(i, i + 12).join(', '));
        }
        return `// Golang Byte Slice
var ${varName} = []byte{
${rows.join(',\n')}
}`;
      }
    }
  };

  const formattedCode = generateCode();

  const handleCopy = () => {
    soundFx.playClick();
    navigator.clipboard.writeText(formattedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    soundFx.playExecute();
    const extMap: Record<TargetLang, string> = {
      c: 'c',
      python: 'py',
      javascript: 'ts',
      rust: 'rs',
      golang: 'go',
    };
    const blob = new Blob([formattedCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${varName}.${extMap[lang]}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#1e293b]">
        <div>
          <h2 className="text-sm font-bold tracking-widest text-[#f0f6fc] uppercase terminal-text flex items-center gap-2">
            <Code2 className="w-4 h-4 text-sky-400" />
            Custom Array & Payload Formatter
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Export raw binary streams into syntactically valid C/C++, Python, TypeScript, Rust, or Go source files.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownload}
            className="text-xs px-3 py-1.5 rounded-lg bg-sky-500/20 border border-sky-500/50 text-sky-300 font-bold hover:bg-sky-500/30 transition-colors flex items-center gap-1.5 shadow-[0_0_12px_rgba(56,189,248,0.15)]"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export .{lang}</span>
          </button>
        </div>
      </div>

      {/* Target Language Selectors */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider terminal-text shrink-0">
          Target Language:
        </span>
        {(['c', 'python', 'javascript', 'rust', 'golang'] as TargetLang[]).map(l => (
          <button
            key={l}
            onClick={() => {
              soundFx.playClick();
              setLang(l);
            }}
            className={`px-3 py-1 rounded text-xs font-mono uppercase transition-colors shrink-0 ${
              lang === l
                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 font-bold'
                : 'bg-[#161b22] text-slate-400 hover:text-slate-200 border border-[#30363d]'
            }`}
          >
            {l === 'c' ? 'C / C++' : l}
          </button>
        ))}
      </div>

      {/* Inputs Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="p-3 rounded-lg bg-[#0f1117] border border-[#1e293b] md:col-span-2">
          <div className="flex items-center justify-between mb-1">
            <label className="text-[10px] text-slate-500 uppercase font-mono">
              Payload Buffer Content
            </label>
            <label className="text-[10px] text-slate-400 font-mono flex items-center gap-1 cursor-pointer">
              <input
                type="checkbox"
                checked={isHexInput}
                onChange={e => setIsHexInput(e.target.checked)}
                className="accent-sky-400"
              />
              Treat input as Raw Hex
            </label>
          </div>
          <input
            type="text"
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            className="w-full bg-[#010409] border border-[#30363d] rounded p-2 text-xs font-mono text-sky-300 focus:outline-none focus:border-sky-400"
          />
        </div>

        <div className="p-3 rounded-lg bg-[#0f1117] border border-[#1e293b]">
          <label className="text-[10px] text-slate-500 uppercase font-mono block mb-1">
            Variable Identifier
          </label>
          <input
            type="text"
            value={varName}
            onChange={e => setVarName(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
            className="w-full bg-[#010409] border border-[#30363d] rounded p-2 text-xs font-mono text-sky-300 focus:outline-none focus:border-sky-400"
          />
        </div>
      </div>

      {/* Code Preview Pane */}
      <div className="p-4 rounded-lg bg-[#010409] border border-[#1e293b] flex flex-col gap-2 font-mono text-xs shadow-inner">
        <div className="flex items-center justify-between border-b border-slate-900 pb-2 text-slate-400">
          <span>GENERATED CODE STRUCT ({bytes.length} BYTES)</span>
          <button
            onClick={handleCopy}
            className="text-xs px-2.5 py-1 rounded bg-[#161b22] border border-[#30363d] text-slate-300 hover:text-sky-300 flex items-center gap-1.5 transition-colors"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span>{copied ? 'Copied' : 'Copy Code'}</span>
          </button>
        </div>

        <pre className="p-3 rounded bg-[#0A0C10] border border-slate-900 text-sky-300 text-xs overflow-x-auto leading-relaxed max-h-72">
          {formattedCode}
        </pre>
      </div>
    </div>
  );
};
