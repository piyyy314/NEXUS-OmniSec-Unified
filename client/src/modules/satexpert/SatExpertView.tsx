import React, { useState } from 'react';
import { 
  Satellite, 
  Radio, 
  ShieldCheck, 
  Terminal, 
  Cpu, 
  Crosshair, 
  Zap, 
  Activity, 
  Layers, 
  Bug, 
  Search, 
  Eye, 
  Wifi, 
  Globe 
} from 'lucide-react';

import { Coordinates, Satellite as SatelliteType, WeatherCondition, TacticalEvent } from '../../satexpert_types';
import { COMMON_SATELLITES } from '../../satexpert_constants';

// Key showcase components from the 79 SatExpert arsenal
import { SentinelAIControl } from '../../components/satexpert/SentinelAIControl';
import { DroneSwarmCommand } from '../../components/satexpert/DroneSwarmCommand';
import { KyberlaserQkdVault } from '../../components/satexpert/KyberlaserQkdVault';
import { OrbitalStriker } from '../../components/satexpert/OrbitalStriker';
import { PurpleTeamArsenal } from '../../components/satexpert/PurpleTeamArsenal';
import { ZeroDayForge } from '../../components/satexpert/ZeroDayForge';
import { SCADAExploit } from '../../components/satexpert/SCADAExploit';
import { RadioInterceptSuite } from '../../components/satexpert/RadioInterceptSuite';
import { SpectrumAnalyzer } from '../../components/satexpert/SpectrumAnalyzer';
import { SignalJammer } from '../../components/satexpert/SignalJammer';
import { DarkLinkProtocol } from '../../components/satexpert/DarkLinkProtocol';
import { GroverVisualizer } from '../../components/satexpert/GroverVisualizer';
import { PalantirAuditSuite } from '../../components/satexpert/PalantirAuditSuite';
import { TacticalHUD } from '../../components/satexpert/TacticalHUD';
import { TacticalMap } from '../../components/satexpert/TacticalMap';
import { ThreatDossier } from '../../components/satexpert/ThreatDossier';
import { YARAScanner } from '../../components/satexpert/YARAScanner';
import { LinkBudgetCalculator } from '../../components/satexpert/LinkBudgetCalculator';

export type SatExpertTab = 
  | 'sentinel_ai' 
  | 'drone_swarm' 
  | 'qkd_vault' 
  | 'orbital_striker' 
  | 'purple_team' 
  | 'zero_day' 
  | 'scada' 
  | 'radio_intercept' 
  | 'spectrum' 
  | 'jammer' 
  | 'dark_link' 
  | 'grover' 
  | 'palantir_audit' 
  | 'tactical_hud' 
  | 'threat_dossier' 
  | 'link_budget';

export const SatExpertView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SatExpertTab>('sentinel_ai');
  const [searchFilter, setSearchFilter] = useState('');

  // Shared Tactical HUD and SatCom State
  const [satellites, setSatellites] = useState<SatelliteType[]>(COMMON_SATELLITES);
  const [selectedSat, setSelectedSat] = useState<SatelliteType>(COMMON_SATELLITES[0] || {
    id: 't-11w',
    name: 'Telstar 11N',
    longitude: -37.5,
    orbitalSlot: '37.5°W',
    operator: 'Telesat',
    status: 'active'
  });
  const [userLoc, setUserLoc] = useState<Coordinates>({ lat: 45.4215, lng: -75.6972 }); // Ottawa / Defense HQ Default
  const [isTracking, setIsTracking] = useState<boolean>(true);
  const [isJamming, setIsJamming] = useState<boolean>(false);
  const [isDecoyActive, setIsDecoyActive] = useState<boolean>(false);
  const [isZPEActive, setIsZPEActive] = useState<boolean>(false);
  const [jammingPower, setJammingPower] = useState<number>(45);
  const [weather, setWeather] = useState<WeatherCondition>('CLEAR');
  const [isStealthMode, setIsStealthMode] = useState<boolean>(false);
  const [hasNewLogs, setHasNewLogs] = useState<boolean>(false);
  const [eventLogs, setEventLogs] = useState<TacticalEvent[]>([
    {
      id: 'init-evt-1',
      timestamp: new Date().toLocaleTimeString(),
      satName: 'Telstar 11N',
      satId: 't-11w',
      status: 'INFO',
      detail: 'SatExpert TSI v6 Tactical Link synchronized across orbital slots.'
    }
  ]);

  const telemetry = {
    snr: 14.8,
    rxPower: -62.4,
    bucTemp: 48.2,
    packetLoss: 0.02,
    status: 'LOCKED',
    azimuth: 142.3,
    elevation: 34.6,
    skew: -18.2,
    frequency: '11.70 GHz'
  };

  const tabs: { id: SatExpertTab; label: string; icon: React.ComponentType<{ className?: string }>; badge: string; category: string }[] = [
    { id: 'sentinel_ai', label: 'Sentinel AI Control', icon: ShieldCheck, badge: 'SENTINEL', category: 'C2' },
    { id: 'drone_swarm', label: 'Drone Swarm Command', icon: Crosshair, badge: 'SWARM', category: 'KINETIC' },
    { id: 'qkd_vault', label: 'Kyberlaser QKD Vault', icon: Cpu, badge: 'QKD', category: 'QUANTUM' },
    { id: 'orbital_striker', label: 'Orbital Striker', icon: Satellite, badge: 'SPACE', category: 'ORBITAL' },
    { id: 'purple_team', label: 'Purple Team Arsenal', icon: Layers, badge: 'EXPLOIT', category: 'RED/BLUE' },
    { id: 'zero_day', label: 'Zero-Day Forge', icon: Bug, badge: '0-DAY', category: 'OFFENSIVE' },
    { id: 'scada', label: 'SCADA / ICS Exploit', icon: Zap, badge: 'ICS', category: 'OFFENSIVE' },
    { id: 'radio_intercept', label: 'Radio Intercept', icon: Radio, badge: 'SIGINT', category: 'RF/SIGINT' },
    { id: 'spectrum', label: 'Spectrum Analyzer', icon: Activity, badge: 'RF', category: 'RF/SIGINT' },
    { id: 'jammer', label: 'Signal Jammer', icon: Wifi, badge: 'EW', category: 'RF/SIGINT' },
    { id: 'dark_link', label: 'DarkLink Protocol', icon: Terminal, badge: 'STEALTH', category: 'COMMS' },
    { id: 'grover', label: 'Grover Visualizer', icon: Eye, badge: 'QUANTUM', category: 'QUANTUM' },
    { id: 'palantir_audit', label: 'Palantir Audit', icon: Search, badge: 'INTEL', category: 'INTEL' },
    { id: 'tactical_hud', label: 'Tactical HUD', icon: Globe, badge: 'HUD', category: 'C2' },
    { id: 'threat_dossier', label: 'Threat Dossier', icon: Layers, badge: 'DOSSIER', category: 'INTEL' },
    { id: 'link_budget', label: 'Link Budget Calc', icon: Satellite, badge: 'VSAT', category: 'VSAT' },
  ];

  const filteredTabs = tabs.filter(t => 
    t.label.toLowerCase().includes(searchFilter.toLowerCase()) || 
    t.category.toLowerCase().includes(searchFilter.toLowerCase())
  );

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'sentinel_ai':
        return <SentinelAIControl />;
      case 'drone_swarm':
        return <DroneSwarmCommand />;
      case 'qkd_vault':
        return <KyberlaserQkdVault />;
      case 'orbital_striker':
        return <OrbitalStriker />;
      case 'purple_team':
        return <PurpleTeamArsenal />;
      case 'zero_day':
        return <ZeroDayForge />;
      case 'scada':
        return <SCADAExploit />;
      case 'radio_intercept':
        return <RadioInterceptSuite />;
      case 'spectrum':
        return <SpectrumAnalyzer />;
      case 'jammer':
        return <SignalJammer />;
      case 'dark_link':
        return <DarkLinkProtocol />;
      case 'grover':
        return <GroverVisualizer />;
      case 'palantir_audit':
        return <PalantirAuditSuite />;
      case 'tactical_hud':
        return (
          <TacticalHUD
            loc={userLoc}
            sat={selectedSat}
            satellites={satellites}
            onLocChange={setUserLoc}
            onSatChange={setSelectedSat}
            onSatellitesUpdate={setSatellites}
            isTracking={isTracking}
            onTrackingChange={setIsTracking}
            isJamming={isJamming}
            setIsJamming={setIsJamming}
            isDecoyActive={isDecoyActive}
            setIsDecoyActive={setIsDecoyActive}
            isZPEActive={isZPEActive}
            setIsZPEActive={setIsZPEActive}
            jammingPower={jammingPower}
            setJammingPower={setJammingPower}
            weather={weather}
            setWeather={setWeather}
            isStealthMode={isStealthMode}
            telemetry={telemetry}
            eventLogs={eventLogs}
            setEventLogs={setEventLogs}
            hasNewLogs={hasNewLogs}
            setHasNewLogs={setHasNewLogs}
          />
        );
      case 'threat_dossier':
        return <ThreatDossier />;
      case 'link_budget':
        return <LinkBudgetCalculator distance={38450} externalRainFade={1.8} isStealthMode={isStealthMode} />;
      default:
        return <SentinelAIControl />;
    }
  };

  return (
    <div className="flex-1 w-full flex flex-col bg-[#05080f] text-[#f1f5f9] overflow-hidden">
      {/* Sub-Header Navigation */}
      <div className="w-full bg-[#090f1d] border-b border-emerald-900/30 px-4 py-2.5 flex items-center justify-between gap-3 overflow-x-auto scrollbar-thin">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-950/80 border border-emerald-500/40 text-emerald-400">
            <Satellite className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              SatExpert Tactical SatCom Intelligence (TSI v6)
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/30">
                79 MODULES
              </span>
            </h2>
            <p className="text-[10px] text-gray-400">VSAT SIGINT, AI Sentinel, Quantum Key Distribution & Drone Swarm C2</p>
          </div>
        </div>

        {/* Tab pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1">
          {filteredTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-150 ${
                  isActive
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-sm shadow-emerald-500/20'
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
export default SatExpertView;
