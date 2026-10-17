import { ChampionMode, MatchPhaseDef, PlayerSource, WheelPhaseDef } from './types';

/**
 * Bausteine für Formate. Sie erzeugen nur Konfigurationsobjekte –
 * alles kann auch direkt als Objekt-Literal geschrieben werden.
 */

type MatchOptions = Omit<MatchPhaseDef, 'kind' | 'teamSize' | 'grouping' | 'championMode' | 'id' | 'label' | 'sources'> & {
  grouping?: MatchPhaseDef['grouping'];
  championMode?: ChampionMode;
};

export const fromEntrants = (): PlayerSource => ({ entrants: true });
export const winnersOf = (phase: string): PlayerSource => ({ phase, take: 'winners' });
export const losersOf = (phase: string): PlayerSource => ({ phase, take: 'losers' });
export const pickedFrom = (phase: string): PlayerSource => ({ phase, take: 'picked' });
export const restOf = (phase: string): PlayerSource => ({ phase, take: 'rest' });

/** 5v5 mit Elo-Balancing, Rollen und Bravery-Champions (Standard). */
export const teamDraft5v5 = (
  id: string,
  label: string,
  sources: PlayerSource[],
  opts: MatchOptions = {}
): MatchPhaseDef => ({
  id,
  label,
  sources,
  kind: 'match',
  teamSize: 5,
  grouping: opts.grouping ?? 'eloBalanced',
  championMode: opts.championMode ?? 'bravery',
  ...opts,
});

/** 2v2 mit zufälligen Duos und freier Champion-Wahl (Standard). */
export const duo2v2 = (
  id: string,
  label: string,
  sources: PlayerSource[],
  opts: MatchOptions = {}
): MatchPhaseDef => ({
  id,
  label,
  sources,
  kind: 'match',
  teamSize: 2,
  grouping: opts.grouping ?? 'random',
  championMode: opts.championMode ?? 'freePick',
  ...opts,
});

/** 1v1 mit freier Champion-Wahl (Standard). */
export const duel1v1 = (
  id: string,
  label: string,
  sources: PlayerSource[],
  opts: MatchOptions = {}
): MatchPhaseDef => ({
  id,
  label,
  sources,
  kind: 'match',
  teamSize: 1,
  grouping: opts.grouping ?? 'random',
  championMode: opts.championMode ?? 'freePick',
  ...opts,
});

/** Glücksrad, das `pickCount` Spieler zieht. */
export const wheelPick = (
  id: string,
  label: string,
  sources: PlayerSource[],
  opts: Partial<Pick<WheelPhaseDef, 'pickCount' | 'pickedLabel' | 'subtitle'>> = {}
): WheelPhaseDef => ({
  id,
  label,
  sources,
  kind: 'wheel',
  pickCount: opts.pickCount ?? 1,
  pickedLabel: opts.pickedLabel,
  subtitle: opts.subtitle,
});
