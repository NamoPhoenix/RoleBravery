import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { EloRating } from '../types';
import { X, UserPlus, Users, FileText } from 'lucide-react';

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BulkImportModal: React.FC<BulkImportModalProps> = ({ isOpen, onClose }) => {
  const { bulkImportPlayers } = useStore();
  const [text, setText] = useState('');
  const [defaultElo, setDefaultElo] = useState<EloRating>('mid');

  if (!isOpen) return null;

  const lines = text
    .split(/[\r\n]+/)
    .map(l => l.trim())
    .filter(l => l.length > 0);

  const handleImport = () => {
    if (lines.length === 0) return;
    bulkImportPlayers(text, defaultElo);
    setText('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#12141a] border border-[#21242e] rounded-xl max-w-lg w-full p-6 shadow-2xl relative flex flex-col font-sans">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#21242e]">
          <div className="flex items-center gap-2.5">
            <Users className="text-slate-400" size={20} />
            <h2 className="text-base font-bold text-slate-100 tracking-wide">
              Massen-Import von Spielern
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-[#1a1d26] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Instructions */}
        <div className="flex items-start gap-2.5 bg-[#181a22] border border-[#2a2e3a] rounded-lg p-3 my-3">
          <FileText size={16} className="text-slate-400 shrink-0 mt-0.5" />
          <p className="text-xs text-slate-300">
            Füge eine Liste von Spielernamen ein – genau <strong>ein Spieler pro Zeile</strong>.
          </p>
        </div>

        {/* Textarea */}
        <div className="my-2">
          <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
            Spielerliste ({lines.length} erkannt)
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={8}
            placeholder={`Caps\nBrokenBlade\nYike\nHans Sama\nMikyX\nFaker\nZeus\nOner\nGumayusi\nKeria`}
            className="w-full bg-[#181a22] border border-[#2c303e] rounded-lg p-3 text-xs font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-slate-500 resize-none custom-scrollbar"
          />
        </div>

        {/* Default Elo option */}
        <div className="flex items-center justify-between py-2 border-t border-[#21242e]">
          <span className="text-xs text-slate-300 font-medium">Standard-Elo für Import:</span>
          <div className="inline-flex rounded-lg bg-[#181a22] p-0.5 border border-[#2c303e] text-xs">
            {(['low', 'mid', 'high'] as EloRating[]).map((elo) => (
              <button
                key={elo}
                type="button"
                onClick={() => setDefaultElo(elo)}
                className={`px-3 py-1 rounded capitalize font-medium transition-all ${
                  defaultElo === elo
                    ? elo === 'high'
                      ? 'bg-rose-950/60 text-rose-300 border border-rose-700/50'
                      : elo === 'mid'
                      ? 'bg-amber-950/60 text-amber-300 border border-amber-700/50'
                      : 'bg-emerald-950/60 text-emerald-300 border border-emerald-700/50'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {elo} ({elo === 'low' ? '1' : elo === 'mid' ? '2' : '3'})
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#21242e] mt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-[#1a1d26] transition-colors"
          >
            Abbrechen
          </button>
          <button
            type="button"
            disabled={lines.length === 0}
            onClick={handleImport}
            className="flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-bold text-slate-900 bg-slate-200 hover:bg-white transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md"
          >
            <UserPlus size={15} />
            {lines.length} Spieler hinzufügen
          </button>
        </div>
      </div>
    </div>
  );
};
