import React, { useState } from 'react';
import { useStore } from './store/useStore';
import { Navbar } from './components/Navbar';
import { BroadcastView } from './components/BroadcastView';
import { PlayerManagementPanel } from './components/PlayerManagementPanel';
import { JsonPoolModal } from './components/JsonPoolModal';
import { BulkImportModal } from './components/BulkImportModal';
import { Lobby } from './components/Lobby';
import { TournamentControl } from './components/tournament/TournamentControl';
import { OverlayApp } from './components/OverlayApp';
import { useRoomSync } from './sync/useRoomSync';
import { isOverlayMode } from './sync/room';
import { Tv } from 'lucide-react';

export const App: React.FC = () => (isOverlayMode ? <OverlayApp /> : <ControlApp />);

const ControlApp: React.FC = () => {
  useRoomSync();
  const { viewMode, setViewMode, appMode } = useStore();
  const [isJsonModalOpen, setIsJsonModalOpen] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const isClassic = appMode === 'classic';

  return (
    <div className="min-h-screen bg-[#020712] text-slate-100 flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-200">
      {/* Navbar: Visible in stream and panel modes */}
      {!(isClassic && viewMode === 'overlay') && (
        <Navbar
          onOpenJsonModal={() => setIsJsonModalOpen(true)}
          onOpenBulkImport={() => setIsBulkImportOpen(true)}
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col items-center justify-center">
        {appMode === 'lobby' && (
          <Lobby
            onOpenBulkImport={() => setIsBulkImportOpen(true)}
            onOpenJsonModal={() => setIsJsonModalOpen(true)}
          />
        )}

        {appMode === 'tournament' && <TournamentControl />}

        {isClassic && viewMode === 'stream' && (
          <BroadcastView onGoToPanel={() => setViewMode('panel')} />
        )}

        {isClassic && viewMode === 'panel' && (
          <PlayerManagementPanel
            onOpenBulkImport={() => setIsBulkImportOpen(true)}
            onOpenJsonModal={() => setIsJsonModalOpen(true)}
          />
        )}

        {isClassic && viewMode === 'overlay' && (
          <div className="w-full h-screen flex flex-col items-center justify-center p-2 relative group">
            {/* Floating exit overlay button on hover */}
            <div className="absolute top-2 right-4 z-50 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => setViewMode('stream')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700 shadow-xl backdrop-blur-md"
              >
                <Tv size={14} />
                <span>Overlay verlassen</span>
              </button>
            </div>
            <BroadcastView onGoToPanel={() => setViewMode('panel')} isOverlayOnly />
          </div>
        )}
      </main>

      {/* Modals */}
      <JsonPoolModal
        isOpen={isJsonModalOpen}
        onClose={() => setIsJsonModalOpen(false)}
      />

      <BulkImportModal
        isOpen={isBulkImportOpen}
        onClose={() => setIsBulkImportOpen(false)}
      />
    </div>
  );
};

export default App;
