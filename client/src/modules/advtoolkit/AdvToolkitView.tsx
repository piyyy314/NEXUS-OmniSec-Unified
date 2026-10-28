import React, { useState, useCallback } from 'react';
import { 
  Cpu, 
  Terminal, 
  Binary, 
  ShieldAlert, 
  Activity, 
  FileCode, 
  Lock, 
  Network, 
  Key, 
  Search, 
  BarChart3,
  Layers,
  Sparkles,
  CheckCircle2,
  X
} from 'lucide-react';

import OperationalDashboard from '../../components/advanced_toolkit/OperationalDashboard';
import Z3SymbolicExecutor from '../../components/advanced_toolkit/Z3SymbolicExecutor';
import EbpfTelemetry from '../../components/advanced_toolkit/EbpfTelemetry';
import HardwareTeeModule from '../../components/advanced_toolkit/HardwareTeeModule';
import PeInspector from '../../components/advanced_toolkit/PeInspector';
import YaraCompiler from '../../components/advanced_toolkit/YaraCompiler';
import EntropyVisualizer from '../../components/advanced_toolkit/EntropyVisualizer';
import AstAnalyzer from '../../components/advanced_toolkit/AstAnalyzer';
import CryptoEngine from '../../components/advanced_toolkit/CryptoEngine';
import ThreatArchive from '../../components/advanced_toolkit/ThreatArchive';
import NetworkAnalysis from '../../components/advanced_toolkit/NetworkAnalysis';

export type ToolkitTab = 
  | 'overview' 
  | 'z3_symbolic' 
  | 'ebpf' 
  | 'hardware_tee' 
  | 'pe_inspector' 
  | 'yara' 
  | 'entropy' 
  | 'ast' 
  | 'crypto' 
  | 'network' 
  | 'archive';

export const AdvToolkitView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ToolkitTab>('overview');
  const [ebpfAlertCount, setEbpfAlertCount] = useState(0);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Global toast notification handler passed down to all sub-components
  const triggerToast = useCallback((msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  }, []);

  // Tab navigation handler passed to OperationalDashboard
  const handleSetActiveTool = useCallback((tool: ToolkitTab | string) => {
    if (['overview','z3_symbolic','ebpf','hardware_tee','pe_inspector','yara','entropy','ast','crypto','network','archive'].includes(tool)) {
      setActiveTab(tool as ToolkitTab);
    }
  }, []);

  const tabs: { id: ToolkitTab; label: string; icon: React.ComponentType<{ className?: string }>; badge: string }[] = [
    { id: 'overview', label: 'Tactical Overview', icon: Activity, badge: 'OPS' },
    { id: 'z3_symbolic', label: 'Z3 SMT Prover', icon: Binary, badge: 'SMT' },
    { id: 'ebpf', label: 'eBPF Kernel Feed', icon: Terminal, badge: 'LIVE' },
    { id: 'hardware_tee', label: 'Hardware TEE', icon: Lock, badge: 'SGX/NITRO' },
    { id: 'pe_inspector', label: 'PE Inspector', icon: FileCode, badge: 'BINARY' },
    { id: 'yara', label: 'YARA Compiler', icon: Search, badge: 'RULES' },
    { id: 'entropy', label: 'Entropy Profiler', icon: BarChart3, badge: 'SHANNON' },
    { id: 'ast', label: 'AST Analyzer', icon: Layers, badge: 'SYNTAX' },
    { id: 'crypto', label: 'Crypto Engine', icon: Key, badge: 'CIPHER' },
    { id: 'network', label: 'Packet Forensics', icon: Network, badge: 'PCAP' },
    { id: 'archive', label: 'Threat Archive', icon: ShieldAlert, badge: 'VAULT' },
  ];

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'overview':
        return <OperationalDashboard setActiveTool={handleSetActiveTool} triggerToast={triggerToast} />;
      case 'z3_symbolic':
        return <Z3SymbolicExecutor triggerToast={triggerToast} />;
      case 'ebpf':
        return <EbpfTelemetry threatLevel="medium" onAlertTriggered={setEbpfAlertCount} triggerToast={triggerToast} />;
      case 'hardware_tee':
        return <HardwareTeeModule triggerToast={triggerToast} />;
      case 'pe_inspector':
        return <PeInspector triggerToast={triggerToast} />;
      case 'yara':
        return <YaraCompiler triggerToast={triggerToast} />;
      case 'entropy':
        return <EntropyVisualizer triggerToast={triggerToast} />;
      case 'ast':
        return <AstAnalyzer triggerToast={triggerToast} />;
      case 'crypto':
        return <CryptoEngine triggerToast={triggerToast} />;
      case 'network':
        return <NetworkAnalysis triggerToast={triggerToast} />;
      case 'archive':
        return <ThreatArchive />;
      default:
        return <OperationalDashboard setActiveTool={handleSetActiveTool} triggerToast={triggerToast} />;
    }
  };

  return (
    <div className="flex-1 w-full flex flex-col bg-[#07090e] text-[#f1f5f9] overflow-hidden relative">
      {/* Toast notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-slate-900 border border-cyan-500/40 text-cyan-300 px-4 py-3 rounded-xl shadow-xl shadow-cyan-950/40 font-mono text-xs animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>{toastMsg}</span>
          <button onClick={() => setToastMsg(null)} className="ml-2 text-slate-500 hover:text-white"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}
      {/* Sub-Header Navigation */}
      <div className="w-full bg-[#0d121d] border-b border-cyan-900/30 px-4 py-2.5 flex items-center justify-between gap-3 overflow-x-auto scrollbar-thin">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-950/80 border border-cyan-500/40 text-cyan-400">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              Advanced Security Toolkit
              <span className="text-[10px] bg-cyan-500/10 text-cyan-400 px-2 py-0.5 rounded border border-cyan-500/30">
                24 MODULES
              </span>
            </h2>
            <p className="text-[10px] text-gray-400">Static Analysis, Z3 SMT Theorem Prover, eBPF & Hardware TEE</p>
          </div>
        </div>

        {/* Tab pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-150 ${
                  isActive
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-sm shadow-cyan-500/20'
                    : 'bg-[#111827]/60 text-gray-400 hover:text-gray-200 hover:bg-[#1f2937]/50 border border-gray-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                <span className="text-[9px] px-1 py-0.2 rounded bg-black/40 text-gray-400 border border-gray-700/50 font-mono">
                  {tab.badge}
                </span>
                {tab.id === 'ebpf' && ebpfAlertCount > 0 && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40 font-mono font-bold">
                    {ebpfAlertCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Module Content Area */}
      <div className="flex-1 w-full overflow-y-auto p-4">
        {renderActiveTab()}
      </div>
    </div>
  );
};
export default AdvToolkitView;
