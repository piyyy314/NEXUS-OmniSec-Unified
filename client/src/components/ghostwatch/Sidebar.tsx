import React from 'react';
import {
  Radio,
  Activity,
  Layers,
  ShieldAlert,
  Eraser,
  FileSearch,
  Code2,
  KeyRound,
  Satellite,
  Search,
  Binary,
  Cpu,
  CheckCircle2,
  Compass
} from 'lucide-react';
import { ModuleId } from '../types';
import { soundFx } from '../utils/audio';

interface SidebarProps {
  activeModule: ModuleId;
  onSelectModule: (id: ModuleId) => void;
}

interface MenuItem {
  id: ModuleId;
  name: string;
  category: string;
  badge?: string;
  icon: React.ElementType;
}

const MENU_ITEMS: MenuItem[] = [
  // Signals
  { id: 'dns', name: 'SIGINT DNS Interceptor', category: 'Signals', badge: 'RFC-1035', icon: Radio },
  { id: 'rf_spectrum', name: 'RF Spectrum Analyzer', category: 'Signals', badge: 'PlutoSDR', icon: Activity },
  { id: 'dsss', name: 'DSSS LPI Spreader', category: 'Signals', badge: 'Anti-Jam', icon: Binary },

  // Network
  { id: 'packet_smith', name: 'IPv4 & ICMP Smith', category: 'Network L3/L4', badge: 'RFC-791', icon: Layers },
  { id: 'port_prober', name: 'WebSocket Port Prober', category: 'Network L3/L4', badge: 'Async', icon: Compass },

  // Defense
  { id: 'log_scrubber', name: 'Active Log Scrubber', category: 'Defense', badge: 'Zero-Fill', icon: Eraser },
  { id: 'ids_heuristics', name: 'Heuristic IDS Evaluator', category: 'Defense', badge: 'RegEx', icon: ShieldAlert },

  // SatCom & Diagnostics
  { id: 'satcom_telemetry', name: 'SatCom Link & Telemetry', category: 'SatCom Systems', badge: 'Ku/L-Band', icon: Satellite },

  // Crypto & Binary
  { id: 'base58', name: 'Base58 Processing Core', category: 'Data & Crypto', badge: 'P2PKH', icon: KeyRound },
  { id: 'file_extractor', name: 'Local File Magic Bytes', category: 'Data & Crypto', badge: 'HexDump', icon: FileSearch },
  { id: 'array_formatter', name: 'Custom Array Formatter', category: 'Data & Crypto', badge: 'C/Py/JS', icon: Code2 },
  { id: 'crypto_vault', name: 'Quantum Crypto Vault', category: 'Data & Crypto', badge: 'Kyber-512', icon: Cpu },
];

export const Sidebar: React.FC<SidebarProps> = ({ activeModule, onSelectModule }) => {
  // Group menu items by category
  const categories = Array.from(new Set(MENU_ITEMS.map(i => i.category)));

  return (
    <nav className="w-full lg:w-64 border-r border-[#1e293b] bg-[#0A0C10] flex flex-col p-3 gap-3 overflow-y-auto shrink-0 select-none">
      <div className="px-2 pt-1 flex items-center justify-between">
        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest terminal-text">
          Active Modules ({MENU_ITEMS.length})
        </p>
        <span className="w-2 h-2 rounded-full bg-sky-400"></span>
      </div>

      <div className="flex flex-col gap-3">
        {categories.map(category => (
          <div key={category} className="flex flex-col gap-1">
            <div className="px-2 py-0.5 text-[9px] font-bold text-slate-600 uppercase tracking-wider terminal-text border-b border-slate-900">
              {category}
            </div>
            {MENU_ITEMS.filter(i => i.category === category).map(item => {
              const Icon = item.icon;
              const isActive = activeModule === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    soundFx.playClick();
                    onSelectModule(item.id);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-md text-xs font-medium transition-all duration-150 flex items-center justify-between group ${
                    isActive
                      ? 'bg-sky-500/15 border border-sky-500/40 text-sky-300 shadow-[0_0_12px_rgba(56,189,248,0.15)] font-semibold'
                      : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Icon
                      className={`w-3.5 h-3.5 shrink-0 transition-colors ${
                        isActive ? 'text-sky-400' : 'text-slate-500 group-hover:text-slate-300'
                      }`}
                    />
                    <span className="truncate">{item.name}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[8px] px-1.5 py-0.5 rounded font-mono uppercase tracking-tight shrink-0 border ${
                        isActive
                          ? 'bg-sky-500/20 text-sky-300 border-sky-500/30'
                          : 'bg-[#161b22] text-slate-500 border-[#30363d]'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Hardware Binding Card at Bottom */}
      <div className="mt-auto pt-2">
        <div className="p-3 rounded-lg bg-[#0f1117] border border-[#1e293b] shadow-inner">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-[9px] text-slate-500 font-bold tracking-wider uppercase terminal-text">HW_BINDING</p>
            <span className="text-[8px] font-mono text-slate-600">HB-9982-AX</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-[10px] text-emerald-400 font-bold terminal-text">CRYPTO-LOCKED</span>
            </div>
            <span className="text-[9px] text-sky-400 font-mono">PQC-OK</span>
          </div>
        </div>
      </div>
    </nav>
  );
};
