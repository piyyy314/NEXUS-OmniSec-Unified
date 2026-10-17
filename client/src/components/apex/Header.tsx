import React from 'react';
import { Shield, Cpu, Code, BookOpen, Download, Terminal, Activity, Zap } from 'lucide-react';
import { AppTrack } from '../types';

interface HeaderProps {
  activeTrack: AppTrack;
  onSelectTrack: (track: AppTrack) => void;
  onDownloadAll: () => void;
  pqcKeysCount: number;
  blockedThreatsCount: number;
  entropyBits: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTrack,
  onSelectTrack,
  onDownloadAll,
  pqcKeysCount,
  blockedThreatsCount,
  entropyBits,
}) => {
  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between py-4 gap-4">
          
          {/* Logo & Platform Info */}
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-500 via-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Shield className="h-5 w-5 text-slate-950 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                  Apex Quantum & Cyber Suite
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    Production Archive
                  </span>
                </h1>
              </div>
              <p className="text-xs text-slate-400">
                Unified Defense Architecture &bull; Tensor Network Simulators &bull; NSA/CISA 2026 Benchmarks
              </p>
            </div>
          </div>

          {/* Real-time System Telemetry Pills */}
          <div className="hidden lg:flex items-center space-x-3 text-xs font-mono">
            <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
              <Activity className="h-3.5 w-3.5 text-emerald-400 animate-pulse" />
              <span className="text-slate-500">Threats Neutralized:</span>
              <span className="text-emerald-400 font-semibold">{blockedThreatsCount}</span>
            </div>
            <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
              <Zap className="h-3.5 w-3.5 text-cyan-400" />
              <span className="text-slate-500">PQC Kyber Keys:</span>
              <span className="text-cyan-400 font-semibold">{pqcKeysCount}</span>
            </div>
            <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
              <Cpu className="h-3.5 w-3.5 text-purple-400" />
              <span className="text-slate-500">Entanglement:</span>
              <span className="text-purple-400 font-semibold">{entropyBits.toFixed(2)} bits</span>
            </div>
          </div>

          {/* Track Switcher & Export Action */}
          <div className="flex items-center space-x-2">
            <div className="flex items-center p-1 rounded-xl bg-slate-900/90 border border-slate-800">
              <button
                onClick={() => onSelectTrack('defense')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeTrack === 'defense'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Shield className="h-3.5 w-3.5" />
                <span>Cyber Defense</span>
              </button>

              <button
                onClick={() => onSelectTrack('quantum')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeTrack === 'quantum'
                    ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Cpu className="h-3.5 w-3.5" />
                <span>Quantum Tensor</span>
              </button>

              <button
                onClick={() => onSelectTrack('vault')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeTrack === 'vault'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Code className="h-3.5 w-3.5" />
                <span>Code Vault</span>
              </button>

              <button
                onClick={() => onSelectTrack('docs')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeTrack === 'docs'
                    ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <BookOpen className="h-3.5 w-3.5" />
                <span>Theory &amp; Docs</span>
              </button>
            </div>

            <button
              onClick={onDownloadAll}
              title="Download entire code archive (.zip / standalone files)"
              className="hidden sm:flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition"
            >
              <Download className="h-3.5 w-3.5 text-emerald-400" />
              <span>Export Suite</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
