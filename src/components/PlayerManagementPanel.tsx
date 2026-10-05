import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { EloRating, Role } from '../types';
import { ROLE_ORDER, ROLE_LABELS, RoleIcon } from './RoleIcon';
import { BanSelector } from './BanSelector';
import {
  UserPlus,
  Trash2,
  Users,
  RefreshCw,
  Search,
  Upload,
  Layers,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface PlayerManagementPanelProps {
  onOpenBulkImport: () => void;
  onOpenJsonModal: () => void;
}

export const PlayerManagementPanel: React.FC<PlayerManagementPanelProps> = ({
  onOpenBulkImport,
  onOpenJsonModal,
}) => {
  const {
    players,
    addPlayer,
    removePlayer,
    updatePlayer,
    clearPlayers,
    loadSamplePlayers,
    generateDraft,
    setViewMode,
  } = useStore();

  const [newName, setNewName] = useState('');
  const [newElo, setNewElo] = useState<EloRating>('mid');
  const [searchFilter, setSearchFilter] = useState('');

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    addPlayer(newName.trim(), newElo);
    setNewName('');
  };

  const toggleRole = (playerId: string, currentRoles: Role[], role: Role) => {
    let nextRoles: Role[];
    if (currentRoles.includes(role)) {
      // Must keep at least one role active
      if (currentRoles.length === 1) return;
      nextRoles = currentRoles.filter(r => r !== role);
    } else {
      nextRoles = [...currentRoles, role];
    }
    updatePlayer(playerId, { roles: nextRoles });
  };

  const handleStartDraft = () => {
    generateDraft();
    setViewMode('stream');
  };

  const filteredPlayers = players.filter(p =>
    p.name.toLowerCase().includes(searchFilter.toLowerCase().trim())
  );

  const matchCount = Math.floor(players.length / 10);
  const benchCount = players.length % 10;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6 bg-[#0b0c10] text-slate-100 min-h-screen">
      {/* Top Banner / Stats */}
      <div className="bg-[#12141a] border border-[#21242e] rounded-xl p-5 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-[#1a1d26] border border-[#2c303e] text-slate-300">
                <Users size={22} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white font-sans tracking-wide flex items-center gap-2">
                  Spieler-Management & Rollen-Präferenzen
                </h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  Verwalte Teilnehmer, Elo-Gewichtung, erlaubte Rollen und individuelle Champion-Bans.
                </p>
              </div>
            </div>
          </div>

          {/* Match distribution status */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-[#181a22] px-4 py-2.5 rounded-lg border border-[#282c38] flex items-center gap-3">
              <div className="text-right">
                <div className="text-xs text-slate-400">Spielerpool</div>
                <div className="text-base font-bold text-slate-100">{players.length} Spieler</div>
              </div>
              <div className="h-7 w-px bg-slate-700" />
              <div className="text-left">
                <div className="text-xs text-slate-400">Mögliche Matches</div>
                <div className="text-base font-bold text-slate-200">
                  {matchCount} {matchCount === 1 ? 'Match' : 'Matches'}
                  {benchCount > 0 && (
                    <span className="text-xs text-amber-400 font-normal ml-1">
                      (+{benchCount} Bank)
                    </span>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={handleStartDraft}
              disabled={players.length < 10}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold font-sans text-sm tracking-wide transition-all shadow-lg ${
                players.length >= 10
                  ? 'bg-slate-200 text-slate-900 hover:bg-white shadow-slate-900/30 active:scale-95'
                  : 'bg-[#181a22] text-slate-600 cursor-not-allowed border border-[#242834]'
              }`}
            >
              <RefreshCw size={15} />
              <span>{matchCount > 0 ? `Teams aufteilen & Draften (${matchCount}x 5v5)` : 'Mind. 10 Spieler nötig'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Quick Entry Form & Bulk Toolbar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Quick Add Player (1-Click & Enter Trigger) */}
        <div className="lg:col-span-7 bg-[#12141a] border border-[#21242e] rounded-xl p-4 shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <UserPlus size={15} className="text-slate-400" />
              <span>Schnelleingabe (Enter-Trigger)</span>
            </h2>
            <span className="text-[11px] text-slate-400">Name tippen und Enter drücken</span>
          </div>

          <form onSubmit={handleAddSubmit} className="flex flex-col sm:flex-row gap-2.5">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Spielername eingeben (z. B. TheShy)..."
              className="flex-1 bg-[#181a22] border border-[#2c303e] rounded-lg px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-slate-500 transition-colors font-sans"
              autoFocus
            />

            {/* Elo Selector */}
            <div className="flex items-center gap-1 bg-[#181a22] p-1 rounded-lg border border-[#2c303e] shrink-0">
              {(['low', 'mid', 'high'] as EloRating[]).map((elo) => (
                <button
                  key={elo}
                  type="button"
                  onClick={() => setNewElo(elo)}
                  className={`px-3 py-1 rounded text-xs font-medium capitalize transition-all ${
                    newElo === elo
                      ? elo === 'high'
                        ? 'bg-rose-950/60 text-rose-300 border border-rose-700/60 font-semibold'
                        : elo === 'mid'
                        ? 'bg-amber-950/60 text-amber-300 border border-amber-700/60 font-semibold'
                        : 'bg-emerald-950/60 text-emerald-300 border border-emerald-700/60 font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {elo === 'low' ? 'Low (1)' : elo === 'mid' ? 'Mid (2)' : 'High (3)'}
                </button>
              ))}
            </div>

            <button
              type="submit"
              disabled={!newName.trim()}
              className="px-5 py-2 rounded-lg bg-slate-200 hover:bg-white text-slate-950 font-bold text-xs transition-colors shrink-0 disabled:opacity-40 disabled:cursor-not-allowed font-sans"
            >
              Hinzufügen
            </button>
          </form>
        </div>

        {/* Quick Tools & Bulk Import Actions */}
        <div className="lg:col-span-5 bg-[#12141a] border border-[#21242e] rounded-xl p-4 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Layers size={15} className="text-slate-400" />
              <span>Aktionen & Vorlagen</span>
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onOpenBulkImport}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#1a1d26] hover:bg-[#232733] text-slate-200 border border-[#2c303e] transition-colors"
            >
              <Upload size={14} className="text-slate-400" />
              Massen-Import
            </button>

            <button
              type="button"
              onClick={() => loadSamplePlayers(10)}
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-[#1a1d26] hover:bg-[#232733] text-slate-300 border border-[#2c303e] transition-colors"
            >
              10 Sample
            </button>

            <button
              type="button"
              onClick={() => loadSamplePlayers(20)}
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-[#1a1d26] hover:bg-[#232733] text-slate-300 border border-[#2c303e] transition-colors"
            >
              20 Sample (2 Matches)
            </button>

            <button
              type="button"
              onClick={onOpenJsonModal}
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-[#1a1d26] hover:bg-[#232733] text-slate-300 border border-[#2c303e] transition-colors"
            >
              Champion-Pool JSON
            </button>

            <button
              type="button"
              onClick={clearPlayers}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 border border-rose-900/40 transition-colors ml-auto"
              title="Alle Spieler löschen"
            >
              <Trash2 size={13} />
              Alle leeren
            </button>
          </div>
        </div>
      </div>

      {/* Players List Table */}
      <div className="bg-[#12141a] border border-[#21242e] rounded-xl shadow-xl overflow-hidden">
        {/* Table Toolbar */}
        <div className="p-4 border-b border-[#21242e] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#151820]">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-200 font-sans">
              Registrierte Spieler ({players.length})
            </span>
            {players.length < 10 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-amber-950/60 border border-amber-800/60 text-amber-300">
                <AlertCircle size={12} />
                Noch {10 - players.length} Spieler für 5v5 nötig
              </span>
            )}
            {players.length >= 10 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-emerald-950/60 border border-emerald-800/60 text-emerald-300">
                <CheckCircle2 size={12} />
                Bereit für {matchCount} Match{matchCount > 1 ? 'es' : ''}
              </span>
            )}
          </div>

          <div className="relative w-full sm:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Spieler filtern..."
              className="w-full bg-[#181a22] border border-[#2c303e] rounded-lg text-xs pl-8 pr-3 py-1.5 text-white placeholder-slate-500 focus:outline-none focus:border-slate-500 font-sans"
            />
          </div>
        </div>

        {/* Players List */}
        {players.length === 0 ? (
          <div className="py-16 text-center">
            <Users size={40} className="mx-auto text-slate-600 mb-3" />
            <p className="text-slate-400 text-sm font-medium">Noch keine Spieler hinzugefügt</p>
            <p className="text-slate-500 text-xs mt-1">
              Nutze die Schnelleingabe oben oder klicke auf "10 Sample" für eine sofortige Testbelegung.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#101217] text-slate-400 uppercase tracking-wider text-[11px] border-b border-[#21242e]">
                <tr>
                  <th className="py-3 px-4 w-12 text-center">#</th>
                  <th className="py-3 px-4 min-w-[160px]">Spielername</th>
                  <th className="py-3 px-4 min-w-[140px]">Elo-Rating (Gewichtung)</th>
                  <th className="py-3 px-4 min-w-[280px]">Erlaubte Rollen (Mind. 1)</th>
                  <th className="py-3 px-4 min-w-[240px]">Individuelle Bans</th>
                  <th className="py-3 px-4 w-16 text-center">Aktion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#21242e]/60">
                {filteredPlayers.map((player, idx) => {
                  const blockIndex = Math.floor(idx / 10) + 1;
                  const isBench = idx >= matchCount * 10;

                  return (
                    <tr
                      key={player.id}
                      className={`hover:bg-[#181b24] transition-colors ${
                        isBench ? 'bg-amber-950/10' : ''
                      }`}
                    >
                      {/* Match Block index or Bench */}
                      <td className="py-3 px-4 text-center font-mono">
                        {isBench ? (
                          <span
                            className="px-1.5 py-0.5 rounded text-[10px] bg-amber-900/30 text-amber-300 border border-amber-800/40"
                            title="Auf der Ersatzbank"
                          >
                            Bank
                          </span>
                        ) : (
                          <span
                            className="px-1.5 py-0.5 rounded text-[10px] bg-[#1a1d26] text-slate-400 border border-[#2c303e]"
                            title={`Match ${blockIndex}`}
                          >
                            M{blockIndex}
                          </span>
                        )}
                      </td>

                      {/* Name with editable field */}
                      <td className="py-3 px-4 font-semibold text-slate-100">
                        <input
                          type="text"
                          value={player.name}
                          onChange={(e) => updatePlayer(player.id, { name: e.target.value })}
                          className="bg-transparent border-b border-transparent hover:border-slate-700 focus:border-slate-500 focus:bg-[#181a22] px-1.5 py-1 rounded text-xs font-semibold text-slate-100 outline-none w-full font-sans"
                        />
                      </td>

                      {/* Elo Selector */}
                      <td className="py-3 px-4">
                        <div className="inline-flex rounded-lg bg-[#181a22] p-0.5 border border-[#2c303e]">
                          {(['low', 'mid', 'high'] as EloRating[]).map((elo) => (
                            <button
                              key={elo}
                              type="button"
                              onClick={() => updatePlayer(player.id, { elo })}
                              className={`px-2 py-0.5 rounded text-[11px] font-medium capitalize transition-all ${
                                player.elo === elo
                                  ? elo === 'high'
                                    ? 'bg-rose-950/60 text-rose-300 font-bold border border-rose-700/50'
                                    : elo === 'mid'
                                    ? 'bg-amber-950/60 text-amber-300 font-bold border border-amber-700/50'
                                    : 'bg-emerald-950/60 text-emerald-300 font-bold border border-emerald-700/50'
                                  : 'text-slate-400 hover:text-slate-200'
                              }`}
                            >
                              {elo === 'low' ? 'Low 1' : elo === 'mid' ? 'Mid 2' : 'High 3'}
                            </button>
                          ))}
                        </div>
                      </td>

                      {/* Role Toggles */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {ROLE_ORDER.map((role) => {
                            const isAllowed = player.roles.includes(role);
                            return (
                              <button
                                key={role}
                                type="button"
                                onClick={() => toggleRole(player.id, player.roles, role)}
                                className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-medium transition-all ${
                                  isAllowed
                                    ? 'bg-[#1e222d] text-white border border-slate-600 shadow-sm'
                                    : 'bg-[#15171e] text-slate-500 border border-[#242834] hover:text-slate-400 opacity-60'
                                }`}
                                title={`${ROLE_LABELS[role]} für ${player.name} ${isAllowed ? 'erlaubt' : 'gesperrt'}`}
                              >
                                <RoleIcon role={role} size={14} />
                                <span className="font-sans font-semibold">{ROLE_LABELS[role]}</span>
                              </button>
                            );
                          })}
                        </div>
                      </td>

                      {/* Individual Bans */}
                      <td className="py-3 px-4">
                        <BanSelector
                          bans={player.bans}
                          onChange={(newBans) => updatePlayer(player.id, { bans: newBans })}
                        />
                      </td>

                      {/* Delete */}
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => removePlayer(player.id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
                          title={`${player.name} entfernen`}
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
