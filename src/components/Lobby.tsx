import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Dices,
  FileSpreadsheet,
  Play,
  Radio,
  RefreshCw,
  Shuffle,
  Swords,
  Trophy,
  Users,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { describeSources } from '../engine/tournament';
import { TOURNAMENT_FORMATS, getFormat, validateFormat } from '../formats';
import { PlayerManagementPanel } from './PlayerManagementPanel';
import { ObsLinkButton } from './ObsLinkButton';
import { useSyncStore } from '../sync/useRoomSync';
import { isFirebaseConfigured } from '../sync/firebase';
import { createNewRoom } from '../sync/room';

export const CLASSIC_MODE_ID = 'classic';

interface LobbyProps {
  onOpenBulkImport: () => void;
  onOpenJsonModal: () => void;
}

/** Hauptmenü: Format wählen, Teilnehmer eintragen, Turnier starten. */
export const Lobby: React.FC<LobbyProps> = ({ onOpenBulkImport, onOpenJsonModal }) => {
  const {
    players,
    selectedFormatId,
    setSelectedFormatId,
    startTournament,
    tournament,
    setAppMode,
    setViewMode,
    loadSamplePlayers,
  } = useStore();
  const roomId = useSyncStore(s => s.roomId);
  const [tab, setTab] = useState<'format' | 'players'>('format');
  const [error, setError] = useState<string | null>(null);

  const format = getFormat(selectedFormatId);
  const isClassic = selectedFormatId === CLASSIC_MODE_ID || !format;
  const runningFormat = getFormat(tournament?.formatId);
  const countOk = !!format && players.length >= format.entrants.min && players.length <= format.entrants.max;
  const formatErrors = format ? validateFormat(format) : [];

  const handleStart = () => {
    if (tournament && !window.confirm('Es läuft bereits ein Turnier. Neues Turnier starten und das alte verwerfen?')) {
      return;
    }
    setError(startTournament());
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-6 flex flex-col gap-5 text-slate-100">
      {/* Kopf */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-[11px] font-mono uppercase tracking-[0.3em] text-slate-500">Custom Lobby</div>
          <h1 className="text-3xl font-extrabold tracking-wide">Hauptmenü</h1>
        </div>
        <div className="flex items-center bg-[#050814] p-1 rounded-full border border-slate-800">
          {(
            [
              ['format', 'Modus & Format', Trophy],
              ['players', `Teilnehmer (${players.length})`, Users],
            ] as const
          ).map(([id, label, Icon]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                tab === id
                  ? 'bg-sky-950/80 text-sky-300 border border-sky-600/60'
                  : 'text-slate-400 hover:text-slate-200 border border-transparent'
              }`}
            >
              <Icon size={13} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {tournament && runningFormat && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 rounded-xl bg-sky-950/40 border border-sky-800/60">
          <div className="flex items-center gap-3">
            <Radio className="text-sky-300" size={18} />
            <div>
              <div className="font-bold">Laufendes Turnier: {runningFormat.name}</div>
              <div className="text-xs text-slate-400">
                {tournament.championIds ? 'Abgeschlossen' : 'Noch nicht entschieden'} · {tournament.entrants.length} Spieler
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setAppMode('tournament')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-black text-sm font-bold"
          >
            Fortsetzen <ArrowRight size={15} />
          </button>
        </div>
      )}

      {tab === 'players' ? (
        <div className="-mx-4">
          <PlayerManagementPanel onOpenBulkImport={onOpenBulkImport} onOpenJsonModal={onOpenJsonModal} />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] gap-5">
          {/* Format-Auswahl */}
          <div className="flex flex-col gap-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">Modus wählen</div>
            {TOURNAMENT_FORMATS.map(f => (
              <ModeCard
                key={f.id}
                selected={format?.id === f.id}
                onClick={() => setSelectedFormatId(f.id)}
                icon={<Trophy size={20} />}
                title={f.name}
                subtitle={f.tagline}
                badge={`${f.entrants.min === f.entrants.max ? f.entrants.min : `${f.entrants.min}–${f.entrants.max}`} Spieler`}
              />
            ))}
            <ModeCard
              selected={isClassic}
              onClick={() => setSelectedFormatId(CLASSIC_MODE_ID)}
              icon={<Shuffle size={20} />}
              title="Klassisch: Balance & Bravery"
              subtitle="Spieler in 10er-Blöcke, Elo-balancierte 5v5-Matches, Bravery-Picks"
              badge="10+ Spieler"
            />

            {/* Live-Sync */}
            <div className="mt-2 rounded-xl border border-[#21242e] bg-[#12141a] p-4 flex flex-col gap-3">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">OBS-Overlay & Live-Sync</div>
              <ObsLinkButton />
              {isFirebaseConfigured ? (
                <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500">
                  <span className="font-mono truncate">Raum: {roomId ?? '…'}</span>
                  <button
                    type="button"
                    className="flex items-center gap-1 text-slate-400 hover:text-slate-200 underline shrink-0"
                    onClick={() => {
                      if (window.confirm('Neuen Raum anlegen? Der alte OBS-Link zeigt dann keine Updates mehr.')) createNewRoom();
                    }}
                  >
                    <RefreshCw size={11} /> Neuer Raum
                  </button>
                </div>
              ) : (
                <div className="text-[11px] text-amber-300/80 leading-relaxed">
                  Keine Firebase-Config gefunden – die App läuft lokal. Das Overlay funktioniert dann nur im selben
                  Browser (z. B. OBS-Fensteraufnahme). Siehe README → „Live-Sync einrichten“.
                </div>
              )}
            </div>
          </div>

          {/* Details */}
          <div className="rounded-xl border border-[#21242e] bg-[#12141a] p-5 flex flex-col gap-4">
            {isClassic ? (
              <>
                <div>
                  <h2 className="text-xl font-bold">Klassischer Modus</h2>
                  <p className="text-sm text-slate-400 mt-1">
                    Der bisherige Ablauf: Spieler werden in 10er-Blöcke aufgeteilt, pro Block ein Elo-balanciertes 5v5 mit
                    Rollen und Bravery-Champions. Rerolls, Bans, Discord-Export und Broadcast-Ansicht wie gewohnt.
                  </p>
                </div>
                <div className="text-sm text-slate-300">
                  {players.length} Spieler → {Math.floor(players.length / 10)} Match(es)
                  {players.length % 10 > 0 && `, ${players.length % 10} auf der Bank`}
                </div>
                <div className="flex flex-wrap gap-2 mt-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setViewMode('stream');
                      setAppMode('classic');
                    }}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-slate-200 hover:bg-white text-slate-900 text-sm font-bold"
                  >
                    <Play size={15} /> Klassischen Modus öffnen
                  </button>
                </div>
              </>
            ) : (
              <>
                <div>
                  <h2 className="text-xl font-bold">{format!.name}</h2>
                  {format!.description && <p className="text-sm text-slate-400 mt-1">{format!.description}</p>}
                </div>
                <ol className="flex flex-col gap-1.5">
                  {format!.phases.map((p, i) => (
                    <li key={p.id} className="flex items-start gap-3 px-3 py-2 rounded-lg bg-[#0e1015] border border-[#21242e]">
                      <span className="w-6 h-6 shrink-0 rounded-full bg-[#1a1d26] border border-[#2d3240] text-xs font-bold flex items-center justify-center">
                        {i + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-sm">{p.label}</span>
                          <PhaseBadge phase={p} />
                        </div>
                        <div className="text-[11px] text-slate-500">Teilnehmer: {describeSources(format!, p)}</div>
                      </div>
                    </li>
                  ))}
                  <li className="flex items-center gap-3 px-3 py-2 rounded-lg bg-amber-400/5 border border-amber-400/30 text-amber-200 text-sm font-semibold">
                    <Trophy size={16} /> Sieger wird „{format!.championTitle}“
                  </li>
                </ol>

                <div
                  className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg border ${
                    countOk
                      ? 'border-emerald-800/60 bg-emerald-950/30 text-emerald-300'
                      : 'border-amber-800/60 bg-amber-950/30 text-amber-300'
                  }`}
                >
                  {countOk ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                  {players.length} / {format!.entrants.min === format!.entrants.max
                    ? format!.entrants.min
                    : `${format!.entrants.min}–${format!.entrants.max}`}{' '}
                  Teilnehmer eingetragen
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setTab('players')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#1a1d26] hover:bg-[#232733] border border-[#2d3240]"
                  >
                    <Users size={13} /> Teilnehmer bearbeiten
                  </button>
                  <button
                    type="button"
                    onClick={onOpenBulkImport}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#1a1d26] hover:bg-[#232733] border border-[#2d3240]"
                  >
                    <FileSpreadsheet size={13} /> Namen importieren
                  </button>
                  <button
                    type="button"
                    onClick={() => loadSamplePlayers(format!.entrants.min)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#1a1d26] hover:bg-[#232733] border border-[#2d3240]"
                  >
                    <Dices size={13} /> {format!.entrants.min} Beispielspieler
                  </button>
                </div>

                {formatErrors.length > 0 && (
                  <div className="text-xs text-rose-300">Format-Fehler: {formatErrors.join(' ')}</div>
                )}
                {error && <div className="text-sm text-rose-300">{error}</div>}

                <button
                  type="button"
                  disabled={!countOk || formatErrors.length > 0}
                  onClick={handleStart}
                  className="mt-auto flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-amber-400 hover:bg-amber-300 text-black text-base font-extrabold tracking-wide uppercase disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Swords size={18} /> Turnier starten & Runde 1 losen
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const ModeCard: React.FC<{
  selected: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  badge?: string;
}> = ({ selected, onClick, icon, title, subtitle, badge }) => (
  <button
    type="button"
    onClick={onClick}
    className={`text-left flex items-start gap-3 p-4 rounded-xl border transition-all ${
      selected
        ? 'border-amber-400/80 bg-gradient-to-r from-amber-400/10 to-transparent shadow-[0_0_25px_rgba(251,191,36,0.08)]'
        : 'border-[#21242e] bg-[#12141a] hover:border-slate-600'
    }`}
  >
    <div className={`p-2 rounded-lg border ${selected ? 'border-amber-400/60 text-amber-300' : 'border-[#2d3240] text-slate-400'}`}>
      {icon}
    </div>
    <div className="min-w-0 flex-1">
      <div className="font-bold">{title}</div>
      {subtitle && <div className="text-xs text-slate-400 mt-0.5">{subtitle}</div>}
    </div>
    {badge && (
      <span className="shrink-0 text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#1a1d26] border border-[#2d3240] text-slate-400">
        {badge}
      </span>
    )}
  </button>
);

const PhaseBadge: React.FC<{ phase: (typeof TOURNAMENT_FORMATS)[number]['phases'][number] }> = ({ phase }) => {
  if (phase.kind === 'wheel') {
    return <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-300 border border-violet-500/30">Glücksrad</span>;
  }
  const size = `${phase.teamSize}v${phase.teamSize}`;
  return (
    <>
      <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-300 border border-sky-500/30">{size}</span>
      <span
        className={`text-[10px] px-2 py-0.5 rounded-full border ${
          phase.championMode === 'bravery'
            ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
            : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
        }`}
      >
        {phase.championMode === 'bravery' ? 'Bravery' : 'Freie Wahl'}
      </span>
    </>
  );
};
