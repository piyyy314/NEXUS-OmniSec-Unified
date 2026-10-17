/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ModuleId } from '../../types';
import { Header } from '../../components/ghostwatch/Header';
import { Sidebar } from '../../components/ghostwatch/Sidebar';
import { FooterBar } from '../../components/ghostwatch/FooterBar';
import { SanitizeModal } from '../../components/ghostwatch/SanitizeModal';

// Module views
import { DnsInterceptor } from '../../components/ghostwatch/modules/DnsInterceptor';
import { RfSpectrumAnalyzer } from '../../components/ghostwatch/modules/RfSpectrumAnalyzer';
import { DsssSimulator } from '../../components/ghostwatch/modules/DsssSimulator';
import { PacketSmith } from '../../components/ghostwatch/modules/PacketSmith';
import { LogScrubber } from '../../components/ghostwatch/modules/LogScrubber';
import { IdsEvaluator } from '../../components/ghostwatch/modules/IdsEvaluator';
import { NetworkProber } from '../../components/ghostwatch/modules/NetworkProber';
import { Base58Core } from '../../components/ghostwatch/modules/Base58Core';
import { FileExtractor } from '../../components/ghostwatch/modules/FileExtractor';
import { ArrayFormatter } from '../../components/ghostwatch/modules/ArrayFormatter';
import { SatComTelemetry } from '../../components/ghostwatch/modules/SatComTelemetry';
import { CryptoVault } from '../../components/ghostwatch/modules/CryptoVault';

import { Menu, X, Shield, Activity, Wifi } from 'lucide-react';
import { soundFx } from '../../utils/audio';

const MODULE_TITLES: Record<ModuleId, string> = {
  dns: 'SIGINT DNS Interceptor',
  rf_spectrum: 'RF Spectrum Analyzer',
  dsss: 'DSSS LPI Spreader',
  packet_smith: 'IPv4 & ICMP Smith',
  port_prober: 'WebSocket Port Prober',
  log_scrubber: 'Active Log Scrubber',
  ids_heuristics: 'Heuristic IDS Evaluator',
  satcom_telemetry: 'SatCom Link & Telemetry',
  base58: 'Base58 Processing Core',
  file_extractor: 'Local File Magic Bytes',
  array_formatter: 'Custom Array Formatter',
  crypto_vault: 'Quantum Crypto Vault',
};

interface GhostWatchViewProps {
  initialModule?: ModuleId;
}

export const GhostWatchView: React.FC<GhostWatchViewProps> = ({ initialModule = 'rf_spectrum' }) => {
  const [activeModule, setActiveModule] = useState<ModuleId>(initialModule);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSanitizeOpen, setIsSanitizeOpen] = useState(false);
  const [sessionNonce, setSessionNonce] = useState(1);

  const handleSelectModule = (id: ModuleId) => {
    setActiveModule(id);
    setIsMobileMenuOpen(false);
  };

  const handleWipeConfirmation = () => {
    setSessionNonce(prev => prev + 1);
    setActiveModule('dns');
  };

  const renderActiveModule = () => {
    switch (activeModule) {
      case 'dns':
        return <DnsInterceptor key={`dns-${sessionNonce}`} />;
      case 'rf_spectrum':
        return <RfSpectrumAnalyzer key={`rf-${sessionNonce}`} />;
      case 'dsss':
        return <DsssSimulator key={`dsss-${sessionNonce}`} />;
      case 'packet_smith':
        return <PacketSmith key={`packet-${sessionNonce}`} />;
      case 'log_scrubber':
        return <LogScrubber key={`scrub-${sessionNonce}`} />;
      case 'ids_heuristics':
        return <IdsEvaluator key={`ids-${sessionNonce}`} />;
      case 'port_prober':
        return <NetworkProber key={`probe-${sessionNonce}`} />;
      case 'base58':
        return <Base58Core key={`b58-${sessionNonce}`} />;
      case 'file_extractor':
        return <FileExtractor key={`file-${sessionNonce}`} />;
      case 'array_formatter':
        return <ArrayFormatter key={`array-${sessionNonce}`} />;
      case 'satcom_telemetry':
        return <SatComTelemetry key={`satcom-${sessionNonce}`} />;
      case 'crypto_vault':
        return <CryptoVault key={`crypto-${sessionNonce}`} />;
      default:
        return <RfSpectrumAnalyzer />;
    }
  };

  return (
    <div className="h-full w-full flex flex-col bg-[#050608] text-[#f1f5f9] overflow-hidden select-none relative font-sans">
      {/* Visual CRT Scanline overlay */}
      <div className="scan-line" />

      {/* Sub Header for GhostWatch */}
      <Header
        activeModuleTitle={MODULE_TITLES[activeModule]}
        onEmergencyWipe={() => {
          soundFx.playAlert();
          setIsSanitizeOpen(true);
        }}
      />

      {/* Main Workspace Frame */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Desktop Sidebar */}
        <div className="hidden md:flex flex-col w-64 border-r border-[#1e293b] bg-[#090b10] z-10 flex-shrink-0">
          <Sidebar
            activeModule={activeModule}
            onSelectModule={handleSelectModule}
          />
        </div>

        {/* Mobile Sidebar Overlay */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-40 flex md:hidden">
            <div
              className="fixed inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <div className="relative w-72 bg-[#090b10] border-r border-[#1e293b] flex flex-col h-full z-50">
              <div className="p-3 border-b border-[#1e293b] flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider text-sky-400 font-mono flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" />
                  Tactical Modules
                </span>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-slate-400 hover:text-white p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                <Sidebar
                  activeModule={activeModule}
                  onSelectModule={handleSelectModule}
                />
              </div>
            </div>
          </div>
        )}

        {/* Module Content Canvas */}
        <main className="flex-1 flex flex-col min-w-0 bg-[#050608] overflow-y-auto relative">
          {/* Mobile Module Trigger Bar */}
          <div className="md:hidden flex items-center justify-between px-3 py-2 bg-[#090b10] border-b border-[#1e293b]">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-slate-400 uppercase tracking-widest">Active:</span>
              <span className="text-xs font-mono font-semibold text-sky-400">
                {MODULE_TITLES[activeModule]}
              </span>
            </div>
            <button
              onClick={() => {
                soundFx.playClick();
                setIsMobileMenuOpen(true);
              }}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono bg-sky-500/10 border border-sky-500/30 text-sky-400 rounded hover:bg-sky-500/20"
            >
              <Menu className="w-3.5 h-3.5" />
              <span>Modules</span>
            </button>
          </div>

          <div className="flex-1 p-2 sm:p-4 overflow-y-auto">
            {renderActiveModule()}
          </div>
        </main>
      </div>

      {/* Footer Status Bar */}
      <FooterBar activeModule={activeModule} />

      {/* Emergency Sanitize Modal */}
      <SanitizeModal
        isOpen={isSanitizeOpen}
        onClose={() => setIsSanitizeOpen(false)}
        onConfirmWipe={handleWipeConfirmation}
      />
    </div>
  );
};
