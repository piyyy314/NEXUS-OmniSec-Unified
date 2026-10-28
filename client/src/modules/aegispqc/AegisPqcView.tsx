import React, { useState } from 'react';
import { 
  Shield, 
  Lock, 
  Key, 
  Activity, 
  Flame, 
  FileText, 
  BarChart2, 
  Play, 
  AlertTriangle 
} from 'lucide-react';

import { ThreatMonitor } from '../../components/aegis_pqc/ThreatMonitor';
import { KeyGenerator } from '../../components/aegis_pqc/KeyGenerator';
import { PqcBenchmarkTool } from '../../components/aegis_pqc/PqcBenchmarkTool';
import { HoneypotFirewall } from '../../components/aegis_pqc/HoneypotFirewall';
import { IncidentReportGenerator } from '../../components/aegis_pqc/IncidentReportGenerator';
import { PalantirDashboard } from '../../components/aegis_pqc/PalantirDashboard';
import { BreachSimulation } from '../../components/aegis_pqc/BreachSimulation';
import { AuditHistory } from '../../components/aegis_pqc/AuditHistory';
import { NetworkPacketInspector } from '../../components/aegis_pqc/NetworkPacketInspector';

export type AegisPqcTab = 
  | 'threat_monitor' 
  | 'honeypot' 
  | 'pqc_bench' 
  | 'keygen' 
  | 'breach_sim' 
  | 'palantir' 
  | 'packet_inspector'
  | 'incident_reports'
  | 'audit_history';

export const AegisPqcView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AegisPqcTab>('threat_monitor');

  const tabs: { id: AegisPqcTab; label: string; icon: React.ComponentType<{ className?: string }>; badge: string }[] = [
    { id: 'threat_monitor', label: 'Threat Monitor', icon: Shield, badge: 'SOC' },
    { id: 'honeypot', label: 'Honeypot Firewall', icon: Flame, badge: 'ACTIVE' },
    { id: 'pqc_bench', label: 'PQC Benchmark', icon: Lock, badge: 'FIPS 203' },
    { id: 'keygen', label: 'PQC Key Generator', icon: Key, badge: 'DILITHIUM' },
    { id: 'breach_sim', label: 'Breach Simulation', icon: Play, badge: 'CHAOS' },
    { id: 'palantir', label: 'Palantir Audit', icon: Activity, badge: 'INTEL' },
    { id: 'packet_inspector', label: 'Packet Inspector', icon: BarChart2, badge: 'DEEP' },
    { id: 'incident_reports', label: 'Incident Reports', icon: FileText, badge: 'AUTO' },
    { id: 'audit_history', label: 'Audit History', icon: AlertTriangle, badge: 'LOGS' },
  ];

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'threat_monitor':
        return <ThreatMonitor />;
      case 'honeypot':
        return <HoneypotFirewall onAlertTriggered={() => {}} />;
      case 'pqc_bench':
        return <PqcBenchmarkTool />;
      case 'keygen':
        return <KeyGenerator onKeyGenerated={() => {}} />;
      case 'breach_sim':
        return <BreachSimulation onIncidentGenerated={() => {}} onMitigateAttack={() => {}} />;
      case 'palantir':
        return <PalantirDashboard />;
      case 'packet_inspector':
        return <NetworkPacketInspector />;
      case 'incident_reports':
        return (
          <IncidentReportGenerator
            isOpen={true}
            onClose={() => {}}
            auditResult={null}
            targetName="Unified Aegis Post-Quantum Gateway"
          />
        );
      case 'audit_history':
        return <AuditHistory history={[]} onSelectEntry={() => {}} onClearHistory={() => {}} />;
      default:
        return <ThreatMonitor />;
    }
  };

  return (
    <div className="flex-1 w-full flex flex-col bg-[#06080e] text-[#f1f5f9] overflow-hidden">
      {/* Sub-Header Navigation */}
      <div className="w-full bg-[#0a0e1a] border-b border-indigo-900/30 px-4 py-2.5 flex items-center justify-between gap-3 overflow-x-auto scrollbar-thin">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-950/80 border border-indigo-500/40 text-indigo-400">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              Aegis Post-Quantum Cybersecurity Suite
              <span className="text-[10px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded border border-indigo-500/30">
                PQC FIPS 203/204
              </span>
            </h2>
            <p className="text-[10px] text-gray-400">Automated Breach Response, Honeypots & Cryptographic Audit</p>
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
                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/50 shadow-sm shadow-indigo-500/20'
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
export default AegisPqcView;
