import React, { useState } from 'react';
import {
  Check,
  CheckCircle2,
  Circle,
  CircleDot,
  Copy,
  Crown,
  Dices,
  Eye,
  GitBranch,
  MonitorPlay,
  RefreshCw,
  Trophy,
  Undo2,
  XCircle,
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import { getFormat, MatchPhaseDef, TournamentFormat, WheelPhaseDef } from '../../formats';
import {
  canRerollPhase,
  describeSources,
  isSpinRevealed,
  playerMap,
  TMatch,
  TournamentState,
} from '../../engine/tournament';
import { ROLE_LABELS, RoleIcon } from '../RoleIcon';
import { ScaledStage, useNow } from './ScaledStage';
import { TournamentStage } from './TournamentStage';
import { BracketView } from './BracketView';

const btn =
  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed disabled:active:scale-100';
const btnNeutral = `${btn} bg-[#1a1d26] hover:bg-[#232733] text-slate-200 border-[#2d3240]`;

/** Control-Panel für den Turniermodus. */
export const TournamentControl: React.FC = () => {
  const tournament = useStore(s => s.tournament);
  const historyLength = useStore(s => s.tournamentHistory.length);
  const overlayView = useStore(s => s.overlayView);
  const { setOverlayView, undoTournament, endTournament, setTournamentFocus } = useStore();
  const format = getFormat(tournament?.formatId);
  const spinning =
    !!tournament &&
    Object.values(tournament.phases).some(ps => ps.wheel?.spins.some(s => !isSpinRevealed(s, Date.now())));
  const now = useNow(spinning);

  if (!tournament || !format) {
    return (
      <div className="p-10 text-center text-slate-400">
        Kein Turnier aktiv.{' '}
        <button className="underline" onClick={endTournament}>
          Zur Lobby
        </button>
      </div>
    );
  }

  const focusDef = format.phases.find(p => p.id === tournament.focus.phaseId) ?? format.phases[0];
  const players = playerMap(tournament);

  return (
    <div className="w-full max-w-[1800px] mx-auto px-4 py-4 flex flex-col gap-4 text-slate-100">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#12141a] border border-[#21242e] rounded-xl px-4 py-3">
        <div>
          <div className="text-[11px] font-mono uppercase tracking-widest text-slate-500">Turnier läuft</div>
          <div className="text-lg font-bold tracking-wide">{format.name}</div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-[#050814] p-1 rounded-full border border-slate-800">
            <span className="px-2 text-[11px] text-slate-500 uppercase tracking-wider">Overlay</span>
            {(
              [
                ['match', 'Aktuelles Match', MonitorPlay],
                ['bracket', 'Turnierbaum', GitBranch],
              ] as const
            ).map(([view, label, Icon]) => (
              <button
                key={view}
                type="button"
                onClick={() => setOverlayView(view)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                  overlayView === view
                    ? 'bg-sky-950/80 text-sky-300 border border-sky-600/60'
                    : 'text-slate-400 hover:text-slate-200 border border-transparent'
                }`}
              >
                <Icon size={13} />
                {label}
              </button>
            ))}
          </div>
          <button type="button" className={btnNeutral} disabled={historyLength === 0} onClick={undoTournament}>
            <Undo2 size={14} /> Rückgängig {historyLength > 0 && <span className="text-slate-500">({historyLength})</span>}
          </button>
          <button
            type="button"
            className={`${btn} bg-rose-950/40 hover:bg-rose-950/70 text-rose-300 border-rose-900/60`}
            onClick={() => {
              if (window.confirm('Turnier wirklich beenden? Der Turnier-Stand wird verworfen.')) endTournament();
            }}
          >
            <XCircle size={14} /> Turnier beenden
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[240px_1fr] gap-4">
        {/* Phasen */}
        <nav className="bg-[#12141a] border border-[#21242e] rounded-xl p-2 h-fit">
          {format.phases.map((def, i) => {
            const ps = tournament.phases[def.id];
            const Icon = ps.status === 'done' ? CheckCircle2 : ps.status === 'active' ? CircleDot : Circle;
            const active = def.id === focusDef.id;
            return (
              <button
                key={def.id}
                type="button"
                onClick={() => setTournamentFocus(def.id, 0)}
                className={`w-full flex items-start gap-2.5 px-3 py-2 rounded-lg text-left transition-colors ${
                  active ? 'bg-sky-950/60 border border-sky-700/60' : 'border border-transparent hover:bg-[#1a1d26]'
                }`}
              >
                <Icon
                  size={16}
                  className={`mt-0.5 shrink-0 ${
                    ps.status === 'done' ? 'text-emerald-400' : ps.status === 'active' ? 'text-sky-400' : 'text-slate-600'
                  }`}
                />
                <div className="min-w-0">
                  <div className={`text-sm font-semibold ${ps.status === 'pending' ? 'text-slate-500' : 'text-slate-100'}`}>
                    {i + 1}. {def.label}
                  </div>
                  {def.subtitle && <div className="text-[11px] text-slate-500">{def.subtitle}</div>}
                </div>
              </button>
            );
          })}
          <div
            className={`mt-1 flex items-center gap-2.5 px-3 py-2 rounded-lg ${
              tournament.championIds ? 'text-amber-300' : 'text-slate-600'
            }`}
          >
            <Trophy size={16} />
            <span className="text-sm font-semibold">
              {tournament.championIds
                ? tournament.championIds.map(id => players.get(id)?.name).join(' & ')
                : format.championTitle}
            </span>
          </div>
        </nav>

        <div className="flex flex-col gap-4 min-w-0">
          {tournament.championIds && (
            <div className="flex items-center gap-3 px-5 py-4 rounded-xl bg-amber-400/10 border border-amber-400/60">
              <Trophy className="text-amber-300" />
              <div className="text-lg font-bold text-amber-200">
                {format.championTitle}: {tournament.championIds.map(id => players.get(id)?.name).join(' & ')}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 2xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-4">
            {/* Steuerung der fokussierten Phase */}
            <section className="bg-[#12141a] border border-[#21242e] rounded-xl p-4 min-w-0">
              <PhasePanel tournament={tournament} format={format} phaseId={focusDef.id} now={now} />
            </section>

            {/* Overlay-Vorschau */}
            <section className="bg-[#12141a] border border-[#21242e] rounded-xl p-3 min-w-0 h-fit">
              <div className="flex items-center gap-2 mb-2 text-xs text-slate-400">
                <Eye size={14} /> Overlay-Vorschau ({overlayView === 'bracket' ? 'Turnierbaum' : 'Aktuelles Match'})
              </div>
              <ScaledStage className="w-full aspect-video rounded-lg border border-[#262a36]">
                <TournamentStage />
              </ScaledStage>
            </section>
          </div>

          {/* Turnierbaum im Control-Panel */}
          <section className="bg-[#12141a] border border-[#21242e] rounded-xl p-3">
            <div className="flex items-center gap-2 mb-2 text-xs text-slate-400">
              <GitBranch size={14} /> Turnierbaum – Match anklicken, um es zu fokussieren
            </div>
            <ScaledStage className="w-full aspect-video rounded-lg border border-[#262a36]">
              <BracketView
                tournament={tournament}
                format={format}
                now={now}
                onSelect={(phaseId, idx) => setTournamentFocus(phaseId, idx)}
              />
            </ScaledStage>
          </section>
        </div>
      </div>
    </div>
  );
};

const PhasePanel: React.FC<{ tournament: TournamentState; format: TournamentFormat; phaseId: string; now: number }> = ({
  tournament,
  format,
  phaseId,
  now,
}) => {
  const def = format.phases.find(p => p.id === phaseId)!;
  const ps = tournament.phases[phaseId];
  const { rerollTournamentPhase } = useStore();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-xl font-bold">{def.label}</div>
          <div className="text-xs text-slate-400">
            {def.subtitle} · Teilnehmer: {describeSources(format, def)}
          </div>
        </div>
        {ps.status !== 'pending' && (
          <button
            type="button"
            className={btnNeutral}
            disabled={!canRerollPhase(ps)}
            onClick={() => rerollTournamentPhase(phaseId)}
            title={
              canRerollPhase(ps)
                ? 'Teams, Paarungen, Rollen und Champions dieser Phase neu losen'
                : 'Nicht mehr möglich – es steht bereits ein Ergebnis fest (ggf. Rückgängig nutzen)'
            }
          >
            <RefreshCw size={13} /> Phase neu losen
          </button>
        )}
      </div>

      {ps.status === 'pending' ? (
        <div className="rounded-lg border border-dashed border-[#2a2e3a] p-6 text-center text-sm text-slate-400">
          Diese Phase wird automatisch gelost, sobald feststeht: <b>{describeSources(format, def)}</b>.
        </div>
      ) : def.kind === 'match' ? (
        ps.matches!.map((m, mi) => (
          <MatchControl key={m.id} def={def} match={m} matchIdx={mi} tournament={tournament} />
        ))
      ) : (
        <WheelControl def={def} tournament={tournament} now={now} />
      )}
    </div>
  );
};

const MatchControl: React.FC<{ def: MatchPhaseDef; match: TMatch; matchIdx: number; tournament: TournamentState }> = ({
  def,
  match,
  matchIdx,
  tournament,
}) => {
  const { setMatchWinner, rerollTournamentChampions, setTournamentFocus } = useStore();
  const [copied, setCopied] = useState(false);
  const isFocused = tournament.focus.phaseId === def.id && tournament.focus.matchIdx === matchIdx;
  const decided = match.winner !== null;
  const bravery = def.championMode === 'bravery';

  const copyDiscord = () => {
    const lines = match.teams.map(
      t =>
        `${t.name.toUpperCase()}:\n` +
        t.slots
          .map(
            s =>
              `  • ${s.role ? `[${ROLE_LABELS[s.role].toUpperCase().padEnd(7)}] ` : ''}${s.player.name.padEnd(16)}${
                s.champion ? ` -> ${s.champion.name}` : ''
              }`
          )
          .join('\n')
    );
    navigator.clipboard.writeText(
      `${match.label.toUpperCase()} (${def.label}${bravery ? '' : ' · freie Champion-Wahl'})\n────────────────────────────────────────\n${lines.join('\n\n')}`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`rounded-lg border ${isFocused ? 'border-sky-600/70' : 'border-[#262a36]'} bg-[#0e1015]`}>
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 border-b border-[#21242e]">
        <div className="font-bold">{match.label}</div>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            className={btnNeutral}
            disabled={isFocused}
            onClick={() => setTournamentFocus(def.id, matchIdx)}
          >
            <MonitorPlay size={13} /> {isFocused ? 'Im Overlay' : 'Im Overlay zeigen'}
          </button>
          {bravery && (
            <button
              type="button"
              className={btnNeutral}
              disabled={decided}
              onClick={() => rerollTournamentChampions(def.id, matchIdx)}
            >
              <Dices size={13} /> Champions neu
            </button>
          )}
          <button type="button" className={btnNeutral} onClick={copyDiscord} title="Aufstellung für Discord kopieren">
            {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3">
        {match.teams.map((team, ti) => {
          const won = match.winner === ti;
          const lost = decided && !won;
          return (
            <div
              key={ti}
              className={`rounded-lg border p-2.5 ${
                won ? 'border-amber-400/80 bg-amber-400/5' : 'border-[#262a36]'
              } ${lost ? 'opacity-45' : ''}`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`font-bold ${ti === 0 ? 'text-sky-300' : 'text-rose-300'}`}>{team.name}</span>
                <span className="text-[11px] font-mono text-slate-500">Elo {team.totalElo}</span>
              </div>
              <ul className="space-y-1 mb-3">
                {team.slots.map(s => (
                  <li key={s.player.id} className="flex items-center gap-2 text-sm">
                    {s.role && <RoleIcon role={s.role} size={16} />}
                    <span className="font-semibold truncate">{s.player.name}</span>
                    <span className="ml-auto flex items-center gap-1.5 text-slate-400 text-xs">
                      {s.champion ? (
                        <>
                          <img src={s.champion.image} alt="" className="w-5 h-5 rounded" />
                          {s.champion.name}
                          <button
                            type="button"
                            disabled={decided}
                            onClick={() => rerollTournamentChampions(def.id, matchIdx, s.player.id)}
                            className="p-1 rounded hover:bg-[#232733] disabled:opacity-30"
                            title="Champion neu würfeln"
                          >
                            <Dices size={12} />
                          </button>
                        </>
                      ) : (
                        <span className="text-emerald-400/80">Free Pick</span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                disabled={decided}
                onClick={() => setMatchWinner(def.id, matchIdx, ti)}
                className={`w-full ${btn} justify-center py-2 ${
                  won
                    ? 'bg-amber-400 text-black border-amber-300'
                    : 'bg-emerald-900/30 hover:bg-emerald-800/50 text-emerald-200 border-emerald-800/60'
                }`}
              >
                <Crown size={14} /> {won ? 'Sieger' : `${team.name} gewinnt`}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const WheelControl: React.FC<{ def: WheelPhaseDef; tournament: TournamentState; now: number }> = ({
  def,
  tournament,
  now,
}) => {
  const { spinWheel, setTournamentFocus } = useStore();
  const ps = tournament.phases[def.id];
  const spins = ps.wheel?.spins ?? [];
  const players = playerMap(tournament);
  const spinning = spins.some(s => !isSpinRevealed(s, now));
  const done = spins.length >= def.pickCount;
  const isFocused = tournament.focus.phaseId === def.id;
  const nextPhase = nextDraftedPhase(tournament, def.id);

  return (
    <div className="rounded-lg border border-[#262a36] bg-[#0e1015] p-4 flex flex-col gap-3">
      <div className="text-sm text-slate-300">
        Im Rad: {ps.playerIds.map(id => players.get(id)?.name).join(', ')}
      </div>
      <div className="flex flex-wrap gap-2">
        {!isFocused && (
          <button type="button" className={btnNeutral} onClick={() => setTournamentFocus(def.id)}>
            <MonitorPlay size={13} /> Rad im Overlay zeigen
          </button>
        )}
        <button
          type="button"
          disabled={done || spinning}
          onClick={() => {
            setTournamentFocus(def.id);
            spinWheel(def.id);
          }}
          className={`${btn} px-5 py-2.5 text-sm bg-amber-400 hover:bg-amber-300 text-black border-amber-300`}
        >
          <Dices size={16} /> {spinning ? 'Dreht …' : done ? 'Gezogen' : 'Glücksrad drehen'}
        </button>
        {done && !spinning && nextPhase && (
          <button type="button" className={btnNeutral} onClick={() => setTournamentFocus(nextPhase, 0)}>
            Weiter zur nächsten Phase →
          </button>
        )}
      </div>
      {spins.map(s => (
        <div key={s.id} className="text-lg font-bold text-amber-300">
          {def.pickedLabel ?? 'Gezogen'}: {isSpinRevealed(s, now) ? players.get(s.targetId)?.name : '…'}
        </div>
      ))}
    </div>
  );
};

/** Nächste bereits geloste Phase nach `phaseId` (für "Weiter"). */
function nextDraftedPhase(t: TournamentState, phaseId: string): string | null {
  const f = getFormat(t.formatId);
  if (!f) return null;
  const idx = f.phases.findIndex(p => p.id === phaseId);
  const next = f.phases.slice(idx + 1).find(p => t.phases[p.id].status !== 'pending');
  return next?.id ?? null;
}
