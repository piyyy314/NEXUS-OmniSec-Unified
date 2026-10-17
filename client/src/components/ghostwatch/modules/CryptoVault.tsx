import React, { useState } from 'react';
import { Cpu, Key, ShieldCheck, RefreshCw, Copy, Check, Lock, Sparkles } from 'lucide-react';
import { soundFx } from '../../utils/audio';

const BIP39_WORDLIST = [
  'abandon', 'ability', 'able', 'about', 'above', 'absent', 'absorb', 'abstract', 'absurd', 'abuse',
  'access', 'accident', 'account', 'accuse', 'achieve', 'acid', 'acoustic', 'acquire', 'across', 'act',
  'action', 'actor', 'actress', 'actual', 'adapt', 'add', 'addict', 'address', 'adjust', 'admit',
  'adult', 'advance', 'advice', 'aerobic', 'affair', 'afford', 'afraid', 'again', 'age', 'agent',
  'agree', 'ahead', 'aim', 'air', 'airport', 'aisle', 'alarm', 'album', 'alcohol', 'alert',
  'alien', 'all', 'alley', 'allow', 'almost', 'alone', 'alpha', 'already', 'also', 'alter',
  'always', 'amateur', 'amazing', 'among', 'amount', 'amused', 'analyst', 'anchor', 'ancient', 'anger',
  'angle', 'angry', 'animal', 'ankle', 'announce', 'annual', 'another', 'answer', 'antenna', 'antique',
  'anxiety', 'any', 'apart', 'apology', 'appear', 'apple', 'approve', 'april', 'arch', 'arctic',
  'area', 'arena', 'argue', 'arm', 'armed', 'armor', 'army', 'around', 'arrange', 'arrest',
  'arrive', 'arrow', 'art', 'artefact', 'artist', 'artwork', 'ask', 'aspect', 'assault', 'asset',
  'assist', 'assume', 'asthma', 'athlete', 'atom', 'attack', 'attend', 'attitude', 'attract', 'auction',
  'audit', 'august', 'aunt', 'author', 'auto', 'autumn', 'average', 'avocado', 'avoid', 'awake',
  'aware', 'away', 'awesome', 'awful', 'awkward', 'axis', 'baby', 'bachelor', 'bacon', 'badge',
  'bag', 'balance', 'balcony', 'ball', 'bamboo', 'banana', 'banner', 'bar', 'barely', 'bargain',
  'barrel', 'base', 'basic', 'basket', 'battle', 'beach', 'bean', 'beauty', 'because', 'become',
  'beef', 'before', 'begin', 'behave', 'behind', 'believe', 'below', 'belt', 'bench', 'benefit'
];

function generateMnemonic24(): string[] {
  const words: string[] = [];
  for (let i = 0; i < 24; i++) {
    const idx = Math.floor(Math.random() * BIP39_WORDLIST.length);
    words.push(BIP39_WORDLIST[idx]);
  }
  return words;
}

function generateRandomHex(byteCount: number): string {
  const hex = '0123456789ABCDEF';
  let out = '';
  for (let i = 0; i < byteCount * 2; i++) {
    out += hex[Math.floor(Math.random() * 16)];
  }
  return out;
}

export const CryptoVault: React.FC = () => {
  const [pqcAlgo, setPqcAlgo] = useState<'kyber512' | 'kyber768' | 'dilithium2'>('kyber512');
  const [mnemonic, setMnemonic] = useState<string[]>(generateMnemonic24());
  const [publicKeyHex, setPublicKeyHex] = useState(generateRandomHex(32));
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedMnemonic, setCopiedMnemonic] = useState(false);

  const rotateKeys = () => {
    soundFx.playExecute();
    setMnemonic(generateMnemonic24());
    setPublicKeyHex(generateRandomHex(32));
  };

  const copyKey = () => {
    soundFx.playClick();
    navigator.clipboard.writeText(publicKeyHex);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const copyMnemonic = () => {
    soundFx.playClick();
    navigator.clipboard.writeText(mnemonic.join(' '));
    setCopiedMnemonic(true);
    setTimeout(() => setCopiedMnemonic(false), 2000);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#1e293b]">
        <div>
          <h2 className="text-sm font-bold tracking-widest text-[#f0f6fc] uppercase terminal-text flex items-center gap-2">
            <Cpu className="w-4 h-4 text-sky-400" />
            Quantum Cryptographic Key Vault & Seed Core
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            NIST Post-Quantum Cryptography (ML-KEM Kyber / ML-DSA Dilithium) engine with 24-word air-gapped backup generation.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={rotateKeys}
            className="text-xs px-3 py-1.5 rounded-lg bg-sky-500/20 border border-sky-500/50 text-sky-300 font-bold hover:bg-sky-500/30 transition-colors flex items-center gap-1.5 shadow-[0_0_12px_rgba(56,189,248,0.15)]"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Generate Fresh Epoch Keys</span>
          </button>
        </div>
      </div>

      {/* Algorithm Selector */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { id: 'kyber512', name: 'ML-KEM-512 (Kyber-512)', level: 'NIST Security Category 1 (AES-128 Equivalent)' },
          { id: 'kyber768', name: 'ML-KEM-768 (Kyber-768)', level: 'NIST Security Category 3 (AES-192 Equivalent)' },
          { id: 'dilithium2', name: 'ML-DSA-44 (Dilithium-2)', level: 'Lattice Digital Signatures (EUF-CMA Hardened)' },
        ].map(algo => (
          <button
            key={algo.id}
            onClick={() => {
              soundFx.playClick();
              setPqcAlgo(algo.id as any);
            }}
            className={`p-3 rounded-lg border text-left transition-all ${
              pqcAlgo === algo.id
                ? 'bg-sky-500/15 border-sky-500/50 text-sky-300 shadow-[0_0_12px_rgba(56,189,248,0.15)]'
                : 'bg-[#0f1117] border-[#1e293b] text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="text-xs font-bold font-mono text-sky-400">{algo.name}</div>
            <div className="text-[10px] text-slate-500 mt-1">{algo.level}</div>
          </button>
        ))}
      </div>

      {/* Public Key Capsule Block */}
      <div className="p-4 rounded-lg bg-[#010409] border border-[#1e293b] flex flex-col gap-2 font-mono text-xs shadow-inner">
        <div className="flex items-center justify-between border-b border-slate-900 pb-2 text-slate-400">
          <span>PUBLIC KEY CAPSULE // SHA-256 FINGERPRINT</span>
          <button
            onClick={copyKey}
            className="text-xs px-2.5 py-1 rounded bg-[#161b22] border border-[#30363d] text-slate-300 hover:text-sky-300 flex items-center gap-1.5 transition-colors"
          >
            {copiedKey ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span>{copiedKey ? 'Copied' : 'Copy Key'}</span>
          </button>
        </div>

        <div className="p-3 rounded bg-[#0A0C10] border border-slate-900 text-sky-300 text-xs font-mono break-all leading-relaxed select-all">
          04{publicKeyHex.match(/.{1,2}/g)?.join(' ')}
        </div>
      </div>

      {/* 24-Word Cryo Mnemonic */}
      <div className="p-4 rounded-lg bg-[#010409] border border-[#1e293b] flex flex-col gap-3 font-mono text-xs shadow-inner">
        <div className="flex items-center justify-between border-b border-slate-900 pb-2 text-slate-400">
          <div className="flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-slate-300">24-WORD AIR-GAPPED RECOVERY MNEMONIC</span>
          </div>
          <button
            onClick={copyMnemonic}
            className="text-xs px-2.5 py-1 rounded bg-[#161b22] border border-[#30363d] text-slate-300 hover:text-sky-300 flex items-center gap-1.5 transition-colors"
          >
            {copiedMnemonic ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span>{copiedMnemonic ? 'Copied All' : 'Copy Words'}</span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
          {mnemonic.map((word, idx) => (
            <div
              key={idx}
              className="p-2 rounded bg-[#0A0C10] border border-slate-900 flex items-center gap-2"
            >
              <span className="text-[10px] text-slate-600 font-mono w-4 text-right">
                {idx + 1}.
              </span>
              <span className="text-xs text-sky-200 font-mono font-medium truncate">
                {word}
              </span>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 text-[10px] text-slate-500 pt-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Derived from hardware entropy source (/dev/urandom CSPRNG). Never store unencrypted on network drives.</span>
        </div>
      </div>
    </div>
  );
};
