import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { ChampionPools } from '../types';
import { X, Check, RotateCcw, AlertTriangle, Code } from 'lucide-react';

interface JsonPoolModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const JsonPoolModal: React.FC<JsonPoolModalProps> = ({ isOpen, onClose }) => {
  const { championPools, updateChampionPools, resetChampionPools } = useStore();
  const [jsonString, setJsonString] = useState<string>(() => JSON.stringify(championPools, null, 2));
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSave = () => {
    try {
      const parsed = JSON.parse(jsonString);

      // Validate required keys
      const requiredKeys: (keyof ChampionPools)[] = ['top', 'jgl', 'mid', 'adc', 'sup'];
      for (const key of requiredKeys) {
        if (!Array.isArray(parsed[key])) {
          throw new Error(`Das JSON muss ein Array für "${key}" enthalten.`);
        }
        if (parsed[key].length === 0) {
          throw new Error(`Das Array für "${key}" darf nicht leer sein.`);
        }
      }

      updateChampionPools(parsed as ChampionPools);
      setError(null);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Ungültiges JSON-Format');
    }
  };

  const handleReset = () => {
    resetChampionPools();
    setTimeout(() => {
      const state = useStore.getState();
      setJsonString(JSON.stringify(state.championPools, null, 2));
      setError(null);
    }, 50);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#12141a] border border-[#21242e] rounded-xl max-w-2xl w-full p-6 shadow-2xl relative flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#21242e]">
          <div className="flex items-center gap-2.5">
            <Code className="text-slate-400" size={20} />
            <h2 className="text-base font-bold text-slate-100 font-sans tracking-wide">
              Champion-Pool JSON Konfiguration
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-[#1a1d26] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Info */}
        <p className="text-xs text-slate-400 mt-3 mb-2 font-sans">
          Hier kannst du deine rollenspezifischen Champion-Listen (top, jgl, mid, adc, sup) einfügen oder anpassen.
        </p>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-rose-950/60 border border-rose-800/80 rounded-lg text-rose-200 text-xs my-2 font-sans">
            <AlertTriangle size={16} className="shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 p-3 bg-emerald-950/60 border border-emerald-800/80 rounded-lg text-emerald-200 text-xs my-2 font-sans">
            <Check size={16} className="shrink-0 text-emerald-400" />
            <span>Champion-Pool erfolgreich aktualisiert!</span>
          </div>
        )}

        {/* Textarea */}
        <div className="flex-1 my-3 overflow-hidden">
          <textarea
            value={jsonString}
            onChange={(e) => {
              setJsonString(e.target.value);
              setError(null);
            }}
            rows={14}
            className="w-full h-full bg-[#181a22] border border-[#2c303e] rounded-lg p-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-slate-500 resize-none custom-scrollbar"
            spellCheck={false}
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-[#21242e]">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white bg-[#1a1d26] hover:bg-[#232733] border border-[#2c303e] transition-colors font-sans"
          >
            <RotateCcw size={14} />
            Standard wiederherstellen
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-[#1a1d26] transition-colors font-sans"
            >
              Abbrechen
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold text-slate-950 bg-slate-200 hover:bg-white transition-all shadow-md font-sans"
            >
              <Check size={14} />
              Speichern
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
