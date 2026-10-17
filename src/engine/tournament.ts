import { ChampionPools, Player } from '../types';
import { MatchPhaseDef, PhaseDef, PlayerSource, TournamentFormat, WheelPhaseDef } from '../formats/types';
import { drawTeamPairs, rerollTeamChampions, TTeam } from './teams';

/**
 * Generische Turnier-Engine. Alle Funktionen sind pur: Sie bekommen einen
 * State und liefern einen neuen zurück (wichtig für Undo und Sync).
 */

export interface TMatch {
  id: string;
  label: string;
  teams: TTeam[];
  winner: number | null;
}

export interface WheelSpin {
  id: string;
  /** Spieler-IDs der Rad-Segmente zum Zeitpunkt des Drehens. */
  segmentIds: string[];
  targetId: string;
  /** Zufallsversatz innerhalb des Segments (-0.35 … 0.35). */
  jitter: number;
  at: number;
}

export interface PhaseState {
  status: 'pending' | 'active' | 'done';
  playerIds: string[];
  matches?: TMatch[];
  wheel?: { spins: WheelSpin[] };
}

export interface TournamentState {
  id: string;
  formatId: string;
  createdAt: number;
  entrants: Player[];
  phases: Record<string, PhaseState>;
  /** Was Control-Panel und Overlay gerade zeigen. */
  focus: { phaseId: string; matchIdx: number };
  championIds: string[] | null;
}

/** Dauer der Glücksrad-Animation (ms). */
export const SPIN_MS = 7000;

const uid = () => Math.random().toString(36).slice(2, 10);

export const playerMap = (t: TournamentState) => new Map(t.entrants.map(p => [p.id, p]));

export const isPhaseComplete = (def: PhaseDef, ps: PhaseState | undefined): boolean => {
  if (!ps || ps.status === 'pending') return false;
  if (def.kind === 'match') return !!ps.matches?.length && ps.matches.every(m => m.winner !== null);
  return (ps.wheel?.spins.length ?? 0) >= def.pickCount;
};

const teamIds = (team: TTeam) => team.slots.map(s => s.player.id);

/** Liefert die Spieler-IDs einer Quelle oder null, wenn sie noch nicht feststeht. */
export function resolveSource(t: TournamentState, format: TournamentFormat, src: PlayerSource): string[] | null {
  if ('entrants' in src) return t.entrants.map(p => p.id);
  const def = format.phases.find(p => p.id === src.phase);
  const ps = t.phases[src.phase];
  if (!def || !isPhaseComplete(def, ps)) return null;
  if (src.take === 'all') return ps.playerIds;
  if (def.kind === 'match') {
    return ps.matches!.flatMap(m =>
      m.teams.flatMap((team, idx) => ((idx === m.winner) === (src.take === 'winners') ? teamIds(team) : []))
    );
  }
  const picked = ps.wheel!.spins.map(s => s.targetId);
  return src.take === 'picked' ? picked : ps.playerIds.filter(id => !picked.includes(id));
}

function draftMatchPhase(t: TournamentState, def: MatchPhaseDef, ids: string[], pools: ChampionPools): TMatch[] {
  const pm = playerMap(t);
  const players = ids.map(id => pm.get(id)!).filter(Boolean);
  const pairs = drawTeamPairs(players, def.teamSize, def.grouping, def.championMode, pools, def.teamNames);
  return pairs.map((teams, i) => ({
    id: `${def.id}-${i}-${uid()}`,
    label: def.matchLabels?.[i] ?? (pairs.length > 1 ? `${def.label} · Match ${i + 1}` : def.label),
    teams,
    winner: null,
  }));
}

function draftPhase(t: TournamentState, def: PhaseDef, ids: string[], pools: ChampionPools): PhaseState {
  if (def.kind === 'match') {
    return { status: 'active', playerIds: ids, matches: draftMatchPhase(t, def, ids, pools) };
  }
  return { status: 'active', playerIds: ids, wheel: { spins: [] } };
}

/**
 * Lost alle Phasen aus, deren Quellen feststehen, und markiert fertige
 * Phasen. Steht die letzte Phase fest, wird der Gesamtsieger gesetzt.
 */
export function progress(t: TournamentState, format: TournamentFormat, pools: ChampionPools): TournamentState {
  const phases = { ...t.phases };
  let next: TournamentState = { ...t, phases };
  for (const def of format.phases) {
    let ps = phases[def.id];
    if (ps.status === 'pending') {
      const resolved = def.sources.map(src => resolveSource(next, format, src));
      if (resolved.every(r => r !== null)) {
        ps = draftPhase(next, def, Array.from(new Set(resolved.flat() as string[])), pools);
      }
    }
    if (ps.status === 'active' && isPhaseComplete(def, ps)) ps = { ...ps, status: 'done' };
    phases[def.id] = ps;
    next = { ...next, phases };
  }
  const finalDef = format.phases[format.phases.length - 1];
  const finalPs = phases[finalDef.id];
  let championIds: string[] | null = null;
  if (finalPs.status === 'done') {
    if (finalDef.kind === 'match') {
      championIds = finalPs.matches!.flatMap(m => teamIds(m.teams[m.winner!]));
    } else {
      championIds = finalPs.wheel!.spins.map(s => s.targetId);
    }
  }
  return { ...next, championIds };
}

export function createTournament(format: TournamentFormat, players: Player[], pools: ChampionPools): TournamentState {
  const phases: Record<string, PhaseState> = {};
  for (const def of format.phases) phases[def.id] = { status: 'pending', playerIds: [] };
  const t: TournamentState = {
    id: uid(),
    formatId: format.id,
    createdAt: Date.now(),
    entrants: players.map(p => ({ ...p, bans: [...p.bans], roles: [...p.roles] })),
    phases,
    focus: { phaseId: format.phases[0].id, matchIdx: 0 },
    championIds: null,
  };
  return progress(t, format, pools);
}

/** Erste offene Stelle im Turnier (für Auto-Fokus nach einem Sieg). */
export function nextOpenFocus(t: TournamentState, format: TournamentFormat): TournamentState['focus'] {
  for (const def of format.phases) {
    const ps = t.phases[def.id];
    if (ps.status !== 'active') continue;
    if (def.kind === 'match') {
      const idx = ps.matches!.findIndex(m => m.winner === null);
      return { phaseId: def.id, matchIdx: Math.max(0, idx) };
    }
    return { phaseId: def.id, matchIdx: 0 };
  }
  const last = format.phases[format.phases.length - 1];
  return { phaseId: last.id, matchIdx: 0 };
}

const updatePhase = (t: TournamentState, phaseId: string, ps: PhaseState): TournamentState => ({
  ...t,
  phases: { ...t.phases, [phaseId]: ps },
});

export function setMatchWinner(
  t: TournamentState,
  format: TournamentFormat,
  pools: ChampionPools,
  phaseId: string,
  matchIdx: number,
  teamIdx: number
): TournamentState {
  const ps = t.phases[phaseId];
  const match = ps?.matches?.[matchIdx];
  if (!match || match.winner !== null) return t;
  const matches = ps.matches!.map((m, i) => (i === matchIdx ? { ...m, winner: teamIdx } : m));
  const next = progress(updatePhase(t, phaseId, { ...ps, matches }), format, pools);
  return { ...next, focus: nextOpenFocus(next, format) };
}

export function spinWheel(
  t: TournamentState,
  format: TournamentFormat,
  pools: ChampionPools,
  phaseId: string
): TournamentState {
  const def = format.phases.find(p => p.id === phaseId) as WheelPhaseDef | undefined;
  const ps = t.phases[phaseId];
  if (!def || def.kind !== 'wheel' || ps.status !== 'active' || isPhaseComplete(def, ps)) return t;
  const picked = new Set(ps.wheel!.spins.map(s => s.targetId));
  const segmentIds = ps.playerIds.filter(id => !picked.has(id));
  if (segmentIds.length === 0) return t;
  const spin: WheelSpin = {
    id: uid(),
    segmentIds,
    targetId: segmentIds[Math.floor(Math.random() * segmentIds.length)],
    jitter: (Math.random() - 0.5) * 0.7,
    at: Date.now(),
  };
  // Fokus bleibt auf dem Rad, damit das Overlay die Animation zeigt.
  return progress(updatePhase(t, phaseId, { ...ps, wheel: { spins: [...ps.wheel!.spins, spin] } }), format, pools);
}

/** Darf die Phase noch neu gelost werden? (kein Sieger / keine Drehung) */
export const canRerollPhase = (ps: PhaseState | undefined): boolean =>
  !!ps &&
  ps.status === 'active' &&
  (ps.matches ? ps.matches.every(m => m.winner === null) : (ps.wheel?.spins.length ?? 0) === 0);

export function rerollPhase(
  t: TournamentState,
  format: TournamentFormat,
  pools: ChampionPools,
  phaseId: string
): TournamentState {
  const def = format.phases.find(p => p.id === phaseId);
  const ps = t.phases[phaseId];
  if (!def || !canRerollPhase(ps)) return t;
  return updatePhase(t, phaseId, draftPhase(t, def, ps.playerIds, pools));
}

export function rerollMatchChampions(
  t: TournamentState,
  pools: ChampionPools,
  phaseId: string,
  matchIdx: number,
  onlyPlayerId?: string
): TournamentState {
  const ps = t.phases[phaseId];
  const match = ps?.matches?.[matchIdx];
  if (!match || match.winner !== null) return t;
  const teams = match.teams.map(team =>
    onlyPlayerId && !team.slots.some(s => s.player.id === onlyPlayerId)
      ? team
      : rerollTeamChampions(team, pools, onlyPlayerId)
  );
  const matches = ps.matches!.map((m, i) => (i === matchIdx ? { ...m, teams } : m));
  return updatePhase(t, phaseId, { ...ps, matches });
}

/* ───────────── Ableitungen für Anzeige (Baum / Overlay) ───────────── */

/** Ist die letzte Drehung des Rads schon fertig animiert? */
export const isSpinRevealed = (spin: WheelSpin, now: number) => now - spin.at >= SPIN_MS;

/**
 * Darf eine Phase angezeigt werden? Phasen, deren Teilnehmer von einem
 * noch laufenden Glücksrad abhängen, bleiben bis zum Ende der Animation
 * verdeckt – sonst würde der Baum das Ergebnis vorwegnehmen.
 */
export function isPhaseRevealed(t: TournamentState, format: TournamentFormat, phaseId: string, now: number): boolean {
  const def = format.phases.find(p => p.id === phaseId);
  if (!def) return false;
  return def.sources.every(src => {
    if ('entrants' in src) return true;
    const srcDef = format.phases.find(p => p.id === src.phase);
    const ps = t.phases[src.phase];
    if (srcDef?.kind === 'wheel' && ps.wheel?.spins.some(s => !isSpinRevealed(s, now))) return false;
    return isPhaseRevealed(t, format, src.phase, now);
  });
}

export type PlayerStatus = 'alive' | 'out' | 'champion';

/** Status jedes Teilnehmers + Markierungen (z. B. "Wildcard"). */
export function playerStatuses(
  t: TournamentState,
  format: TournamentFormat,
  now: number
): Map<string, { status: PlayerStatus; tag?: string }> {
  const result = new Map<string, { status: PlayerStatus; tag?: string }>();
  for (const p of t.entrants) result.set(p.id, { status: 'alive' });

  format.phases.forEach((def, idx) => {
    const ps = t.phases[def.id];
    if (ps.status === 'pending' || !isPhaseRevealed(t, format, def.id, now)) return;
    const consumed = new Set(
      format.phases.slice(idx + 1).flatMap(d => d.sources.flatMap(s => ('phase' in s && s.phase === def.id ? [s.take] : [])))
    );
    const isFinal = idx === format.phases.length - 1;
    if (def.kind === 'match') {
      for (const m of ps.matches ?? []) {
        if (m.winner === null) continue;
        m.teams.forEach((team, ti) => {
          const won = ti === m.winner;
          const survives = isFinal ? won : consumed.has(won ? 'winners' : 'losers') || consumed.has('all');
          for (const id of teamIds(team)) {
            const prev = result.get(id);
            result.set(id, { status: survives ? 'alive' : 'out', tag: prev?.tag });
          }
        });
      }
    } else {
      const revealed = (ps.wheel?.spins ?? []).filter(s => isSpinRevealed(s, now)).map(s => s.targetId);
      for (const id of revealed) result.set(id, { status: 'alive', tag: def.pickedLabel ?? 'Gezogen' });
    }
  });

  if (t.championIds && isPhaseRevealed(t, format, format.phases[format.phases.length - 1].id, now)) {
    for (const id of t.championIds) result.set(id, { status: 'champion', tag: format.championTitle });
  }
  return result;
}

/** Text für Platzhalter: "Sieger Runde 1", "Wildcard" … */
export function describeSources(format: TournamentFormat, def: PhaseDef): string {
  const takeLabel: Record<string, string> = {
    winners: 'Sieger',
    losers: 'Verlierer',
    all: 'Alle aus',
    picked: 'Gezogen:',
    rest: 'Rest aus',
  };
  return def.sources
    .map(src => {
      if ('entrants' in src) return 'Alle Teilnehmer';
      const ref = format.phases.find(p => p.id === src.phase);
      if (ref?.kind === 'wheel' && src.take === 'picked') return ref.pickedLabel ?? `Gezogen: ${ref.label}`;
      return `${takeLabel[src.take]} ${ref?.label ?? src.phase}`;
    })
    .join(' + ');
}
