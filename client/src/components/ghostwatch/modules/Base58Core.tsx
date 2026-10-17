import React, { useState } from 'react';
import { KeyRound, ArrowRightLeft, Copy, Check, Info } from 'lucide-react';
import { soundFx } from '../../utils/audio';

const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
const ALPHABET_MAP: { [k: string]: number } = {};
for (let i = 0; i < ALPHABET.length; i++) {
  ALPHABET_MAP[ALPHABET.charAt(i)] = i;
}

// Full BigInt-based Base58 encoder with leading-zero handling
function encodeBase58(bytes: Uint8Array): string {
  if (bytes.length === 0) return '';
  let zeroes = 0;
  while (zeroes < bytes.length && bytes[zeroes] === 0) {
    zeroes++;
  }

  // Convert bytes to BigInt
  let num = 0n;
  for (let i = zeroes; i < bytes.length; i++) {
    num = (num << 8n) | BigInt(bytes[i]);
  }

  let encoded = '';
  while (num > 0n) {
    const rem = Number(num % 58n);
    num = num / 58n;
    encoded = ALPHABET.charAt(rem) + encoded;
  }

  // Add leading '1's for each leading 0x00 byte
  return '1'.repeat(zeroes) + encoded;
}

// Full BigInt-based Base58 decoder
function decodeBase58(str: string): Uint8Array | null {
  if (!str) return new Uint8Array(0);
  let zeroes = 0;
  while (zeroes < str.length && str.charAt(zeroes) === '1') {
    zeroes++;
  }

  let num = 0n;
  for (let i = zeroes; i < str.length; i++) {
    const ch = str.charAt(i);
    const val = ALPHABET_MAP[ch];
    if (val === undefined) {
      return null; // Invalid character
    }
    num = num * 58n + BigInt(val);
  }

  // Convert BigInt to byte array
  const hex = num.toString(16);
  const paddedHex = hex.length % 2 !== 0 ? '0' + hex : hex;
  const byteCount = hex === '0' ? 0 : paddedHex.length / 2;
  const result = new Uint8Array(zeroes + byteCount);

  for (let i = 0; i < zeroes; i++) {
    result[i] = 0;
  }

  if (hex !== '0') {
    for (let i = 0; i < byteCount; i++) {
      result[zeroes + i] = parseInt(paddedHex.substr(i * 2, 2), 16);
    }
  }

  return result;
}

export const Base58Core: React.FC = () => {
  const [direction, setDirection] = useState<'encode' | 'decode'>('encode');
  const [inputVal, setInputVal] = useState('Ghost-C2-SatCom-Payload-2026');
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const switchDirection = () => {
    soundFx.playClick();
    const newDir = direction === 'encode' ? 'decode' : 'encode';
    setDirection(newDir);
    setErrorMsg(null);
  };

  let resultOutput = '';
  let hexPreview = '';

  try {
    if (direction === 'encode') {
      const bytes = new TextEncoder().encode(inputVal);
      resultOutput = encodeBase58(bytes);
      hexPreview = Array.from(bytes).map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' ');
    } else {
      const decodedBytes = decodeBase58(inputVal.trim());
      if (!decodedBytes) {
        throw new Error('Illegal Base58 character found (contains 0, O, I, or l)');
      }
      resultOutput = new TextDecoder('utf-8', { fatal: false }).decode(decodedBytes);
      hexPreview = Array.from(decodedBytes).map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' ');
    }
  } catch (err: any) {
    resultOutput = '';
    hexPreview = '';
  }

  const copyResult = () => {
    soundFx.playClick();
    navigator.clipboard.writeText(resultOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#1e293b]">
        <div>
          <h2 className="text-sm font-bold tracking-widest text-[#f0f6fc] uppercase terminal-text flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-sky-400" />
            Base58 Encoding & Decoding Core
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Strict Bitcoin/IPFS Base58 alphabet transformer with zero-byte preservation (excludes 0, O, I, l).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={switchDirection}
            className="text-xs px-3 py-1.5 rounded-lg bg-[#161b22] border border-sky-500/40 text-sky-300 hover:bg-sky-500/20 transition-colors flex items-center gap-1.5 font-mono"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>Mode: {direction === 'encode' ? 'ENCODE (Text → B58)' : 'DECODE (B58 → Text)'}</span>
          </button>
        </div>
      </div>

      {/* Input */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold text-slate-400 font-mono">
          {direction === 'encode' ? 'Cleartext / Raw Input String:' : 'Base58 Encoded String:'}
        </label>
        <textarea
          value={inputVal}
          onChange={e => setInputVal(e.target.value)}
          placeholder={direction === 'encode' ? 'Enter string to encode...' : 'Paste Base58 string...'}
          className="w-full h-24 bg-[#010409] border border-[#30363d] rounded-lg p-3 text-xs font-mono text-sky-300 focus:outline-none focus:border-sky-400 leading-relaxed resize-y"
        />
      </div>

      {/* Result Card */}
      <div className="p-4 rounded-lg bg-[#010409] border border-[#1e293b] flex flex-col gap-2 font-mono text-xs shadow-inner">
        <div className="flex items-center justify-between border-b border-slate-900 pb-2 text-slate-400">
          <span>{direction === 'encode' ? 'BASE58 OUTPUT' : 'DECODED CLEARTEXT'}</span>
          <button
            onClick={copyResult}
            className="text-xs px-2.5 py-1 rounded bg-[#161b22] border border-[#30363d] text-slate-300 hover:text-sky-300 flex items-center gap-1.5 transition-colors"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span>{copied ? 'Copied' : 'Copy Output'}</span>
          </button>
        </div>

        <div className="p-3 rounded bg-[#0A0C10] border border-slate-900 text-sky-300 text-xs font-mono break-all leading-relaxed min-h-[48px] select-all">
          {resultOutput || <span className="text-slate-600">Enter input above...</span>}
        </div>

        {hexPreview && (
          <div className="mt-2 text-[11px] text-slate-500">
            <span>Raw Byte Representation:</span>
            <div className="p-2 rounded bg-[#0A0C10] border border-slate-900 text-slate-400 font-mono overflow-x-auto mt-1">
              {hexPreview}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
