import React, { useEffect, useState } from 'react';
import { Shield, Volume2, VolumeX, Terminal, Cpu, Wifi, Lock } from 'lucide-react';
import { soundFx } from '../utils/audio';

interface HeaderProps {
  activeModuleTitle: string;
  onEmergencyWipe: () => void;
}

export const Header: React.FC<HeaderProps> = ({ activeModuleTitle, onEmergencyWipe }) => {
  const [uptimeSeconds, setUptimeSeconds] = useState(142 * 86400 + 22 * 3600 + 9 * 60 + 41);
  const [soundEnabled, setSoundEnabled] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      setUptimeSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatUptime = (totalSec: number) => {
    const days = Math.floor(totalSec / 86400);
    const hours = Math.floor((totalSec % 86400) / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    return `${days}:${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleSound = () => {
    soundFx.enabled = !soundEnabled;
    setSoundEnabled(!soundEnabled);
    if (!soundEnabled) {
      soundFx.playClick();
    }
  };

  return (
    <header className="h-14 border-b border-[#1e293b] bg-[#0A0C10] flex items-center justify-between px-4 md:px-6 z-20 select-none">
      {/* Brand Identity */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded bg-sky-500/20 border border-sky-500/50 flex items-center justify-center shrink-0 shadow-[0_0_12px_rgba(56,189,248,0.25)]">
          <div className="w-3.5 h-3.5 bg-sky-400 rotate-45 transform transition-transform hover:rotate-90 duration-300"></div>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xs md:text-sm font-bold tracking-widest text-sky-400 terminal-text">
              GHOST-WATCH // APEX TERMINAL
            </h1>
            <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[9px] font-bold terminal-text bg-sky-950/60 text-sky-300 border border-sky-800/60">
              v6.0-PQC
            </span>
          </div>
          <p className="text-[10px] text-slate-500 terminal-text tracking-tighter flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block"></span>
            <span>SYSTEM_STATUS: PQC-HARDENED // NODE: GW-9982-ALPHA</span>
            <span className="text-slate-600 hidden md:inline">|</span>
            <span className="text-slate-400 hidden md:inline font-mono">[{activeModuleTitle}]</span>
          </p>
        </div>
      </div>

      {/* Right Controls & Telemetry */}
      <div className="flex items-center gap-4 sm:gap-7">
        <div className="hidden lg:block text-right">
          <p className="text-[9px] text-slate-500 terminal-text uppercase">Uptime</p>
          <p className="text-xs text-slate-300 terminal-text font-mono font-medium">{formatUptime(uptimeSeconds)}</p>
        </div>

        <div className="hidden sm:block text-right">
          <p className="text-[9px] text-slate-500 terminal-text uppercase">Authorization</p>
          <div className="flex items-center gap-1 justify-end">
            <Shield className="w-3 h-3 text-sky-400" />
            <p className="text-xs text-sky-400 font-bold terminal-text">LEVEL 5 // OVERSEER</p>
          </div>
        </div>

        {/* Audio Toggle */}
        <button
          onClick={toggleSound}
          title={soundEnabled ? 'Mute Cyber Audio FX' : 'Enable Cyber Audio FX'}
          className="p-1.5 rounded bg-[#161b22] border border-[#30363d] text-slate-400 hover:text-sky-400 hover:border-sky-500/50 transition-colors"
        >
          {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-sky-400" /> : <VolumeX className="w-3.5 h-3.5 text-slate-600" />}
        </button>

        {/* Restricted Security Badge */}
        <div className="px-2.5 py-1 border border-rose-500/50 bg-rose-500/10 rounded text-rose-400 text-[9px] sm:text-[10px] font-bold tracking-widest flex items-center gap-1.5 shadow-[0_0_10px_rgba(244,63,94,0.15)]">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
          <span>RESTRICTED</span>
        </div>

        {/* Quick Wipe Button */}
        <button
          onClick={() => {
            soundFx.playAlert();
            onEmergencyWipe();
          }}
          title="Trigger Emergency Sanitize Protocol"
          className="hidden md:flex items-center gap-1 px-2.5 py-1 rounded bg-rose-950/40 border border-rose-800/80 text-rose-300 text-[10px] font-bold tracking-wider hover:bg-rose-900/60 transition-colors uppercase terminal-text"
        >
          <Lock className="w-3 h-3" />
          <span>Sanitize</span>
        </button>
      </div>
    </header>
  );
};
