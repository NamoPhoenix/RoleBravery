import React from 'react';
import { useStore } from '../store/useStore';
import {
  Tv,
  Users,
  Code,
  RefreshCw,
  Radio,
  FileSpreadsheet
} from 'lucide-react';

interface NavbarProps {
  onOpenJsonModal: () => void;
  onOpenBulkImport: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenJsonModal,
  onOpenBulkImport,
}) => {
  const { viewMode, setViewMode, players, generateDraft } = useStore();

  return (
    <header className="w-full bg-[#12141a]/95 border-b border-[#22252e] backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo / Brand */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#1e222d] border border-slate-700 flex items-center justify-center">
            <span className="font-sans font-black text-slate-200 text-sm tracking-tighter">RB</span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-sans font-bold text-sm tracking-wider text-slate-100">
                ROLE BRAVERY
              </span>
            </div>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center bg-[#050814] p-1 rounded-full border border-slate-800">
          <button
            type="button"
            onClick={() => setViewMode('stream')}
            className={`flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold transition-all ${
              viewMode === 'stream'
                ? 'bg-sky-950/80 text-sky-300 border border-sky-600/60 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Tv size={13} />
            <span>Broadcast Ansicht</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('panel')}
            className={`flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold transition-all ${
              viewMode === 'panel'
                ? 'bg-sky-950/80 text-sky-300 border border-sky-600/60 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users size={13} />
            <span>Spieler-Panel ({players.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('overlay')}
            className={`flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold transition-all ${
              viewMode === 'overlay'
                ? 'bg-sky-950/80 text-sky-300 border border-sky-600/60 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Reine OBS Browser-Source Ansicht"
          >
            <Radio size={13} />
            <span>OBS Overlay</span>
          </button>
        </div>

        {/* Action Tools */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenBulkImport}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-colors"
          >
            <FileSpreadsheet size={13} className="text-sky-400" />
            <span>Import</span>
          </button>

          <button
            type="button"
            onClick={onOpenJsonModal}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-colors"
            title="Champion-Pools JSON konfigurieren"
          >
            <Code size={13} className="text-amber-400" />
            <span>Pool JSON</span>
          </button>

          {/* Quick Shuffle Button */}
          <button
            type="button"
            disabled={players.length < 10}
            onClick={() => {
              generateDraft();
              setViewMode('stream');
            }}
            className="flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold text-slate-950 bg-slate-200 hover:bg-white transition-all shadow-md shadow-slate-900/20 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <RefreshCw size={13} />
            <span>Shuffle</span>
          </button>
        </div>
      </div>
    </header>
  );
};
