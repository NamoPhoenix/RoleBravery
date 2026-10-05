import React, { useState, useRef, useEffect } from 'react';
import { ALL_CHAMPIONS_SORTED, getChampionImages } from '../data/defaultChampions';
import { X, Search, Plus } from 'lucide-react';

interface BanSelectorProps {
  bans: string[];
  onChange: (newBans: string[]) => void;
}

export const BanSelector: React.FC<BanSelectorProps> = ({ bans, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const availableChamps = ALL_CHAMPIONS_SORTED.filter(
    champ =>
      !bans.includes(champ) &&
      champ.toLowerCase().includes(search.toLowerCase().trim())
  ).slice(0, 15);

  const addBan = (champ: string) => {
    onChange([...bans, champ]);
    setSearch('');
  };

  const removeBan = (champ: string) => {
    onChange(bans.filter(b => b !== champ));
  };

  return (
    <div className="relative" ref={wrapperRef}>
      {/* Ban chips */}
      <div className="flex flex-wrap items-center gap-1.5 min-h-[30px]">
        {bans.map(champ => {
          const img = getChampionImages(champ);
          return (
            <span
              key={champ}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-950/70 border border-red-800/60 text-red-200"
            >
              <img
                src={img.icon}
                alt={champ}
                className="w-3.5 h-3.5 rounded-full object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <span>{champ}</span>
              <button
                type="button"
                onClick={() => removeBan(champ)}
                className="text-red-400 hover:text-red-100 focus:outline-none"
                title={`Ban für ${champ} entfernen`}
              >
                <X size={12} />
              </button>
            </span>
          );
        })}

        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
        >
          <Plus size={12} />
          <span>Ban</span>
        </button>
      </div>

      {/* Dropdown search modal */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-1.5 w-64 bg-[#12141a] border border-[#2a2e3a] rounded-lg shadow-2xl p-2 z-50 backdrop-blur-md">
          <div className="relative mb-2">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Champion suchen..."
              className="w-full bg-[#181a22] border border-[#2c303e] rounded text-xs pl-8 pr-2 py-1.5 text-white placeholder-slate-500 focus:outline-none focus:border-slate-500"
              autoFocus
            />
          </div>

          <div className="max-h-48 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
            {availableChamps.length === 0 ? (
              <div className="text-xs text-slate-400 text-center py-2">
                Keine Champions gefunden
              </div>
            ) : (
              availableChamps.map(champ => {
                const img = getChampionImages(champ);
                return (
                  <button
                    key={champ}
                    type="button"
                    onClick={() => addBan(champ)}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-red-950/50 hover:text-red-300 text-slate-200 text-xs transition-colors text-left"
                  >
                    <img
                      src={img.icon}
                      alt={champ}
                      className="w-5 h-5 rounded-full object-cover border border-slate-700"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                    <span className="truncate">{champ}</span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
