import React, { useState, useEffect } from 'react';
import { useStore } from './store/useStore';
import { Navbar } from './components/Navbar';
import { BroadcastView } from './components/BroadcastView';
import { PlayerManagementPanel } from './components/PlayerManagementPanel';
import { JsonPoolModal } from './components/JsonPoolModal';
import { BulkImportModal } from './components/BulkImportModal';
import { Tv } from 'lucide-react';

export const App: React.FC = () => {
  const { viewMode, setViewMode, matches, players, generateDraft } = useStore();
  const [isJsonModalOpen, setIsJsonModalOpen] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);

  // Initialize draft if players exist and no matches yet
  useEffect(() => {
    if (matches.length === 0 && players.length >= 10) {
      generateDraft();
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#020712] text-slate-100 flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-200">
      {/* Navbar: Visible in stream and panel modes */}
      {viewMode !== 'overlay' && (
        <Navbar
          onOpenJsonModal={() => setIsJsonModalOpen(true)}
          onOpenBulkImport={() => setIsBulkImportOpen(true)}
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col items-center justify-center">
        {viewMode === 'stream' && (
          <BroadcastView onGoToPanel={() => setViewMode('panel')} />
        )}

        {viewMode === 'panel' && (
          <PlayerManagementPanel
            onOpenBulkImport={() => setIsBulkImportOpen(true)}
            onOpenJsonModal={() => setIsJsonModalOpen(true)}
          />
        )}

        {viewMode === 'overlay' && (
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
