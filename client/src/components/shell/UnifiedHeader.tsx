/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Shield,
  Radio,
  Satellite,
  Cpu,
  BarChart2,
  Volume2,
  VolumeX,
  Sparkles,
  Lock,
  Activity,
  Terminal,
  Layers,
  Menu,
  X,
  CheckCircle2,
} from 'lucide-react';
import { soundFx } from '../../utils/audio';

export type WorkspaceId = 'aegis' | 'ghostwatch' | 'satcom' | 'nexus' | 'modellab';

interface UnifiedHeaderProps {
  activeWorkspace: WorkspaceId;
  onSelectWorkspace: (ws: WorkspaceId) => void;
  onToggleAiDrawer: () => void;
  isAiDrawerOpen: boolean;
}

export const UnifiedHeader: React.FC<UnifiedHeaderProps> = ({
  activeWorkspace,
  onSelectWorkspace,
  onToggleAiDrawer,
  isAiDrawerOpen,
}) => {
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleAudio = () => {
    const nextState = !isAudioMuted;
    setIsAudioMuted(nextState);
    soundFx.enabled = !nextState;
    if (!nextState) soundFx.playClick();
  };

  const navItems: { id: WorkspaceId; label: string; icon: React.ComponentType<{ className?: string }>; badge?: string }[] = [
    { id: 'aegis', label: 'Aegis Sentinel', icon: Shield, badge: 'DEFENSE' },
    { id: 'ghostwatch', label: 'Ghost-Watch C2', icon: Radio, badge: 'SIGINT' },
    { id: 'satcom', label: 'SatCom Link', icon: Satellite, badge: 'ORBITAL' },
    { id: 'nexus', label: 'Shadow313 Core', icon: Lock, badge: 'PQC 205' },
    { id: 'modellab', label: 'Model Lab', icon: BarChart2, badge: 'AI COST' },
  ];

  const handleNavClick = (id: WorkspaceId) => {
    soundFx.playClick();
    onSelectWorkspace(id);
    setMobileMenuOpen(false);
  };

  return (
    <header className="bg-[#090b10] border-b border-[#1e293b] text-white select-none z-30 sticky top-0">
      <div className="max-w-[1920px] mx-auto px-3 sm:px-5 flex items-center justify-between h-14">
        {/* Brand & Suite Title */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 via-sky-500 to-emerald-500 p-[1px] flex items-center justify-center">
              <div className="w-full h-full bg-[#050608] rounded-lg flex items-center justify-center">
                <Shield className="w-4 h-4 text-sky-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-sm tracking-widest text-white">
                  NEXUS <span className="text-sky-400">OMNISEC</span>
                </span>
                <span className="hidden xl:inline-block text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-950/60 border border-purple-800/40 text-purple-300">
                  v4.0.0 UNIFIED
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-emerald-400">PQC FIPS 203/205</span>
                <span className="text-slate-600">|</span>
                <span className="text-slate-400">NODE: LOCALHOST</span>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Workspace Tabs */}
        <nav className="hidden lg:flex items-center gap-1 bg-[#050608] p-1 rounded-xl border border-[#1e293b]">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeWorkspace === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
                  isActive
                    ? 'bg-sky-500/15 text-sky-300 border border-sky-500/40 shadow-sm shadow-sky-950'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/40 border border-transparent'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-sky-400' : 'text-slate-500'}`} />
                <span>{item.label}</span>
                {item.badge && (
                  <span
                    className={`text-[9px] px-1 py-0.2 rounded ${
                      isActive ? 'bg-sky-400/20 text-sky-200' : 'bg-slate-800/80 text-slate-400'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Right Action Bar */}
        <div className="flex items-center gap-2">
          {/* Sound Toggle */}
          <button
            onClick={toggleAudio}
            className={`p-2 rounded-lg border text-xs transition-colors ${
              isAudioMuted
                ? 'border-slate-800 text-slate-500 hover:text-slate-300'
                : 'border-slate-800 text-sky-400 hover:bg-sky-950/30'
            }`}
            title={isAudioMuted ? 'Unmute tactical audio' : 'Mute tactical audio'}
          >
            {isAudioMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* AI Sidecar Toggle */}
          <button
            onClick={() => {
              soundFx.playClick();
              onToggleAiDrawer();
            }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono font-medium border transition-all ${
              isAiDrawerOpen
                ? 'bg-purple-950/60 border-purple-500/50 text-purple-200 shadow-md shadow-purple-950'
                : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden sm:inline">AI Copilot</span>
          </button>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg border border-slate-800 text-slate-400 hover:text-white"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-800 bg-[#050608] p-3 space-y-1">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeWorkspace === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between p-2.5 rounded-lg text-xs font-mono ${
                  isActive
                    ? 'bg-sky-500/15 text-sky-300 border border-sky-500/40'
                    : 'text-slate-400 hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4 text-sky-400" />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};
