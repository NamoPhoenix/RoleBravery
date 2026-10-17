import React from 'react';
import { Crown, Dices, Trophy } from 'lucide-react';
import { PhaseDef, TournamentFormat } from '../../formats/types';
import {
  describeSources,
  isPhaseRevealed,
  isSpinRevealed,
  playerMap,
  playerStatuses,
  TournamentState,
} from '../../engine/tournament';

interface BracketViewProps {
  tournament: TournamentState;
  format: TournamentFormat;
  now: number;
  /** Klick auf ein Match/Phase (nur Control-Panel). */
  onSelect?: (phaseId: string, matchIdx: number) => void;
}

/**
 * Turnierbaum: eine Spalte pro Phase + Sieger-Spalte, darunter alle
 * Teilnehmer (ausgeschiedene ausgegraut). Für die 1920×1080-Bühne gebaut.
 */
export const BracketView: React.FC<BracketViewProps> = ({ tournament, format, now, onSelect }) => {
  const statuses = playerStatuses(tournament, format, now);
  const players = playerMap(tournament);
  const champions =
    tournament.championIds && isPhaseRevealed(tournament, format, format.phases[format.phases.length - 1].id, now)
      ? tournament.championIds
      : null;

  return (
    <div className="w-full h-full flex flex-col px-10 py-8 text-slate-100 select-none">
      <div className="flex items-end justify-between shrink-0 mb-6">
        <div>
          <div className="text-[18px] font-mono tracking-[0.3em] text-slate-500 uppercase">Turnierbaum</div>
          <div className="text-[48px] leading-none font-extrabold uppercase tracking-wide">{format.name}</div>
        </div>
        {format.tagline && <div className="text-[22px] text-slate-400">{format.tagline}</div>}
      </div>

      <div className="flex-1 min-h-0 flex gap-4">
        {format.phases.map(def => (
          <PhaseColumn
            key={def.id}
            def={def}
            format={format}
            tournament={tournament}
            now={now}
            statuses={statuses}
            onSelect={onSelect}
          />
        ))}
        <div className="w-[230px] shrink-0 flex flex-col">
          <ColumnHeader label={format.championTitle} subtitle="Gesamtsieger" active={!!champions} />
          <div
            className={`flex-1 flex flex-col items-center justify-center rounded-lg border-2 ${
              champions ? 'border-amber-400 bg-amber-400/10' : 'border-dashed border-[#2a2e3a]'
            }`}
          >
            <Trophy size={64} className={champions ? 'text-amber-300' : 'text-slate-700'} />
            <div className={`mt-4 text-center text-[30px] font-extrabold ${champions ? 'text-amber-300' : 'text-slate-600'}`}>
              {champions ? champions.map(id => players.get(id)?.name).join(' & ') : '?'}
            </div>
          </div>
        </div>
      </div>

      {/* Alle Teilnehmer */}
      <div className="shrink-0 mt-6 flex flex-wrap gap-2">
        {tournament.entrants.map(p => {
          const st = statuses.get(p.id);
          const out = st?.status === 'out';
          const champ = st?.status === 'champion';
          return (
            <span
              key={p.id}
              className={`px-3 py-1 rounded-md text-[17px] font-semibold border ${
                champ
                  ? 'bg-amber-400 text-black border-amber-300'
                  : out
                    ? 'bg-[#101217] text-slate-600 border-[#1c1f28] line-through'
                    : 'bg-[#161922] text-slate-200 border-[#2a2e3a]'
              }`}
            >
              {p.name}
              {st?.tag && !champ && <span className="ml-2 text-amber-300 text-[13px] uppercase">{st.tag}</span>}
            </span>
          );
        })}
      </div>
    </div>
  );
};

const ColumnHeader: React.FC<{ label: string; subtitle?: string; active: boolean }> = ({ label, subtitle, active }) => (
  <div className="mb-3 shrink-0">
    <div className={`text-[24px] font-extrabold uppercase tracking-wider ${active ? 'text-white' : 'text-slate-500'}`}>
      {label}
    </div>
    {subtitle && <div className="text-[15px] font-mono text-slate-500 uppercase tracking-wider">{subtitle}</div>}
  </div>
);

const PhaseColumn: React.FC<{
  def: PhaseDef;
  format: TournamentFormat;
  tournament: TournamentState;
  now: number;
  statuses: ReturnType<typeof playerStatuses>;
  onSelect?: (phaseId: string, matchIdx: number) => void;
}> = ({ def, format, tournament, now, statuses, onSelect }) => {
  const ps = tournament.phases[def.id];
  const revealed = ps.status !== 'pending' && isPhaseRevealed(tournament, format, def.id, now);
  const players = playerMap(tournament);
  const focused = tournament.focus.phaseId === def.id;
  const flex = def.kind === 'match' ? Math.max(1, def.teamSize / 2.5) : 0.9;

  return (
    <div className="min-w-0 flex flex-col" style={{ flex }}>
      <ColumnHeader label={def.label} subtitle={def.subtitle} active={revealed} />
      <div className="flex-1 min-h-0 flex flex-col justify-around gap-3">
        {!revealed ? (
          <div className="rounded-lg border-2 border-dashed border-[#2a2e3a] px-4 py-6 text-center text-[17px] text-slate-500">
            {describeSources(format, def)}
          </div>
        ) : def.kind === 'match' ? (
          ps.matches!.map((m, mi) => (
            <button
              type="button"
              key={m.id}
              disabled={!onSelect}
              onClick={() => onSelect?.(def.id, mi)}
              className={`text-left rounded-lg border-2 bg-[#12141a] overflow-hidden ${
                focused && tournament.focus.matchIdx === mi && m.winner === null
                  ? 'border-sky-500/70'
                  : 'border-[#262a36]'
              } ${onSelect ? 'hover:border-slate-400 cursor-pointer' : 'cursor-default'}`}
            >
              <div className="px-3 py-1 text-[14px] font-mono uppercase tracking-wider text-slate-400 bg-[#181b23]">
                {m.label}
              </div>
              {m.teams.map((team, ti) => {
                const won = m.winner === ti;
                const lost = m.winner !== null && !won;
                return (
                  <div
                    key={ti}
                    className={`px-3 py-1.5 border-t border-[#20232c] ${won ? 'bg-amber-400/10' : ''} ${lost ? 'opacity-40' : ''}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-[17px] font-bold ${won ? 'text-amber-300' : 'text-slate-200'}`}>
                        {team.name}
                      </span>
                      {won && <Crown size={18} className="text-amber-300" />}
                    </div>
                    {team.slots.length > 1 && (
                      <div className="text-[14px] leading-snug text-slate-400">
                        {team.slots.map(s => (
                          <div
                            key={s.player.id}
                            className={`truncate ${statuses.get(s.player.id)?.status === 'out' ? 'line-through text-slate-600' : ''}`}
                          >
                            {s.player.name}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </button>
          ))
        ) : (
          <button
            type="button"
            disabled={!onSelect}
            onClick={() => onSelect?.(def.id, 0)}
            className={`rounded-lg border-2 bg-[#12141a] px-3 py-3 text-left ${
              focused ? 'border-sky-500/70' : 'border-[#262a36]'
            } ${onSelect ? 'hover:border-slate-400 cursor-pointer' : 'cursor-default'}`}
          >
            <div className="flex items-center gap-2 text-[14px] font-mono uppercase tracking-wider text-slate-400 mb-2">
              <Dices size={16} /> Glücksrad
            </div>
            {ps.playerIds.map(id => {
              const picked = ps.wheel?.spins.some(s => s.targetId === id && isSpinRevealed(s, now));
              return (
                <div
                  key={id}
                  className={`text-[16px] truncate ${picked ? 'text-amber-300 font-extrabold' : 'text-slate-300'}`}
                >
                  {players.get(id)?.name}
                  {picked && <span className="ml-1 text-[12px] uppercase">· {def.kind === 'wheel' && def.pickedLabel}</span>}
                </div>
              );
            })}
          </button>
        )}
      </div>
    </div>
  );
};
