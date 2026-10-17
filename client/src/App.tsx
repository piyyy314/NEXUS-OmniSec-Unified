/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { UnifiedHeader, WorkspaceId } from './components/shell/UnifiedHeader';
import { AiSidecar } from './components/shell/AiSidecar';

// Views
import { AegisDashboard } from './modules/aegis/AegisDashboard';
import { GhostWatchView } from './modules/ghostwatch/GhostWatchView';
import { NexusEngineView } from './modules/nexus/NexusEngineView';
import { ModelLabView } from './modules/modellab/ModelLabView';

export default function App() {
  const [activeWorkspace, setActiveWorkspace] = useState<WorkspaceId>('aegis');
  const [isAiDrawerOpen, setIsAiDrawerOpen] = useState(false);

  const renderWorkspace = () => {
    switch (activeWorkspace) {
      case 'aegis':
        return <AegisDashboard />;
      case 'ghostwatch':
        return <GhostWatchView initialModule="rf_spectrum" />;
      case 'satcom':
        return <GhostWatchView initialModule="satcom_telemetry" />;
      case 'nexus':
        return <NexusEngineView />;
      case 'modellab':
        return <ModelLabView />;
      default:
        return <AegisDashboard />;
    }
  };

  return (
    <div className="min-h-screen w-screen flex flex-col bg-[#050608] text-[#f1f5f9] overflow-x-hidden font-sans">
      {/* Global Master Header */}
      <UnifiedHeader
        activeWorkspace={activeWorkspace}
        onSelectWorkspace={setActiveWorkspace}
        onToggleAiDrawer={() => setIsAiDrawerOpen(!isAiDrawerOpen)}
        isAiDrawerOpen={isAiDrawerOpen}
      />

      {/* Main Active Workspace Screen */}
      <div className="flex-1 w-full flex flex-col relative overflow-hidden">
        {renderWorkspace()}
      </div>

      {/* Global AI Copilot Sidecar */}
      <AiSidecar
        isOpen={isAiDrawerOpen}
        onClose={() => setIsAiDrawerOpen(false)}
        activeWorkspace={activeWorkspace}
      />
    </div>
  );
}
