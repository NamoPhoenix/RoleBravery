/**
 * Datenmodell für Turnierformate.
 *
 * Ein Format ist eine reine Konfiguration: eine geordnete Liste von Phasen.
 * Jede Phase beschreibt, woher ihre Teilnehmer kommen (`sources`) und wie
 * gespielt wird. Die Engine (src/engine/tournament.ts) kennt nur die zwei
 * generischen Phasen-Arten `match` und `wheel` – neue Formate brauchen
 * deshalb keinen Engine-Umbau.
 */

export type ChampionMode = 'bravery' | 'freePick';

/** Welche Spieler aus einer vorherigen Phase übernommen werden. */
export type SourceTake =
  | 'winners' // match: alle Spieler der Sieger-Teams
  | 'losers' // match: alle Spieler der Verlierer-Teams
  | 'all' // alle Teilnehmer der Phase
  | 'picked' // wheel: die gezogenen Spieler
  | 'rest'; // wheel: die nicht gezogenen Spieler

export type PlayerSource =
  | { entrants: true } // alle in der Lobby eingetragenen Teilnehmer
  | { phase: string; take: SourceTake };

interface PhaseBase {
  /** Eindeutige ID innerhalb des Formats, wird von `sources` referenziert. */
  id: string;
  /** Anzeigename, z. B. "Runde 1". */
  label: string;
  /** Kurzer Untertitel für Turnierbaum und Overlay. */
  subtitle?: string;
  /** Teilnehmer-Quellen; mehrere Quellen werden zusammengeführt. */
  sources: PlayerSource[];
}

/**
 * Eine Spielphase: Die Spieler werden in Teams der Größe `teamSize`
 * aufgeteilt, die Teams zufällig gegeneinander gelost (je 2 Teams pro Match).
 * 5v5 = teamSize 5, 2v2 = teamSize 2, 1v1 = teamSize 1.
 */
export interface MatchPhaseDef extends PhaseBase {
  kind: 'match';
  teamSize: number;
  /** eloBalanced = Elo-ausgeglichene Teams, random = rein zufällig. */
  grouping: 'eloBalanced' | 'random';
  championMode: ChampionMode;
  /** Teamnamen in Match-Reihenfolge (Match 1: [0] vs [1], Match 2: [2] vs [3] …). */
  teamNames?: string[];
  /** Match-Bezeichnungen, z. B. ["Match 1", "Match 2"]. */
  matchLabels?: string[];
}

/** Glücksrad: zieht `pickCount` Spieler aus den Teilnehmern der Phase. */
export interface WheelPhaseDef extends PhaseBase {
  kind: 'wheel';
  pickCount: number;
  /** Bezeichnung für gezogene Spieler, z. B. "Wildcard". */
  pickedLabel?: string;
}

export type PhaseDef = MatchPhaseDef | WheelPhaseDef;

export interface TournamentFormat {
  id: string;
  name: string;
  tagline?: string;
  description?: string;
  /** Erlaubte Teilnehmerzahl. */
  entrants: { min: number; max: number };
  /** Phasen in Spielreihenfolge. Die letzte Phase ist das Finale. */
  phases: PhaseDef[];
  /** Titel für den Gesamtsieger, z. B. "Fillmaster". */
  championTitle: string;
}
