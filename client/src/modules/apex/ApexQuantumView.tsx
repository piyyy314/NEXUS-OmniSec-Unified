import React, { useState } from 'react';
import { 
  Cpu, 
  Terminal, 
  Binary, 
  FileCode, 
  Database, 
  Radio, 
  BookOpen, 
  ShieldCheck 
} from 'lucide-react';

import { CodeVaultView } from '../../components/apex/CodeVaultView';
import { NebulaQuantumView } from '../../components/apex/NebulaQuantumView';
import { TitanPEPSView } from '../../components/apex/TitanPEPSView';
import { HyperionExascaleView } from '../../components/apex/HyperionExascaleView';
import { VsatToolkitView } from '../../components/apex/VsatToolkitView';
import { DocumentationView } from '../../components/apex/DocumentationView';

export type ApexTab = 'code_vault' | 'nebula' | 'titan' | 'hyperion' | 'vsat_toolkit' | 'docs';

export const ApexQuantumView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ApexTab>('code_vault');
  const [currentEntropy, setCurrentEntropy] = useState(18.5);

  const tabs: { id: ApexTab; label: string; icon: React.ComponentType<{ className?: string }>; badge: string }[] = [
    { id: 'code_vault', label: 'Code Vault Artifacts', icon: Database, badge: 'ARCHIVE' },
    { id: 'nebula', label: 'Project Nebula', icon: Binary, badge: 'TENSOR' },
    { id: 'titan', label: 'Project Titan', icon: Cpu, badge: '2D PEPS' },
    { id: 'hyperion', label: 'Project Hyperion', icon: Terminal, badge: 'EXASCALE' },
    { id: 'vsat_toolkit', label: 'VSAT Blue Team', icon: Radio, badge: 'v2.0' },
    { id: 'docs', label: 'Architecture Docs', icon: BookOpen, badge: 'SPEC' },
  ];

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'code_vault':
        return <CodeVaultView />;
      case 'nebula':
        return <NebulaQuantumView />;
      case 'titan':
        return <TitanPEPSView />;
      case 'hyperion':
        return <HyperionExascaleView currentEntropy={currentEntropy} onUpdateEntropy={setCurrentEntropy} />;
      case 'vsat_toolkit':
        return <VsatToolkitView />;
      case 'docs':
        return <DocumentationView />;
      default:
        return <CodeVaultView />;
    }
  };

  return (
    <div className="flex-1 w-full flex flex-col bg-[#070912] text-[#f1f5f9] overflow-hidden">
      {/* Sub-Header Navigation */}
      <div className="w-full bg-[#0d1020] border-b border-purple-900/30 px-4 py-2.5 flex items-center justify-between gap-3 overflow-x-auto scrollbar-thin">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-purple-950/80 border border-purple-500/40 text-purple-400">
            <Binary className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              Apex Quantum & Cyber Defense Suite
              <span className="text-[10px] bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded border border-purple-500/30">
                TENSOR / PEPS / MPS
              </span>
            </h2>
            <p className="text-[10px] text-gray-400">Quantum Tensor Networks, 2D PEPS Engine & Exascale Boundary MPS</p>
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
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/50 shadow-sm shadow-purple-500/20'
                    : 'bg-[#111827]/60 text-gray-400 hover:text-gray-200 hover:bg-[#1f2937]/50 border border-gray-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                <span className="text-[9px] px-1 py-0.2 rounded bg-black/40 text-gray-400 border border-gray-700/50 font-mono">
                  {tab.badge}
                </span>
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
export default ApexQuantumView;
