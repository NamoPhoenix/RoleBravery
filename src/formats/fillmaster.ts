import { TournamentFormat } from './types';
import { duel1v1, duo2v2, fromEntrants, pickedFrom, restOf, teamDraft5v5, wheelPick, winnersOf } from './presets';

/**
 * Fillmaster (Season 1) – 20 Spieler.
 *
 * R1 (4 Teams, 2 Matches) → R2 (Sieger neu gemischt) → Glücksrad zieht die
 * Wildcard → 2v2-Halbfinale der übrigen 4 → 1v1 im Gewinner-Duo →
 * Finale: Finalist vs Wildcard.
 */
export const fillmaster: TournamentFormat = {
  id: 'fillmaster',
  name: 'Fillmaster',
  tagline: 'Season 1 · 20 Spieler · ein Fillmaster',
  description:
    'Zwei 5v5-Bravery-Runden, Glücksrad-Wildcard, 2v2-Halbfinale, 1v1-Duell und ein 1v1-Finale um den Titel.',
  entrants: { min: 20, max: 20 },
  championTitle: 'Fillmaster',
  phases: [
    teamDraft5v5('r1', 'Runde 1', [fromEntrants()], {
      subtitle: '5v5 · Bravery',
      teamNames: ['Team A', 'Team B', 'Team C', 'Team D'],
      matchLabels: ['Match 1', 'Match 2'],
    }),
    teamDraft5v5('r2', 'Runde 2', [winnersOf('r1')], {
      subtitle: '5v5 · Bravery',
      teamNames: ['Team E', 'Team F'],
      matchLabels: ['Match 3'],
    }),
    wheelPick('wildcard', 'Wildcard', [winnersOf('r2')], {
      subtitle: 'Glücksrad',
      pickCount: 1,
      pickedLabel: 'Wildcard',
    }),
    duo2v2('semi', 'Halbfinale', [restOf('wildcard')], {
      subtitle: '2v2 · Freie Wahl',
      teamNames: ['Duo 1', 'Duo 2'],
      matchLabels: ['Halbfinale'],
    }),
    duel1v1('duoDuel', 'Duo-Duell', [winnersOf('semi')], {
      subtitle: '1v1 · Freie Wahl',
      matchLabels: ['Duell um den Finalplatz'],
    }),
    duel1v1('final', 'Finale', [winnersOf('duoDuel'), pickedFrom('wildcard')], {
      subtitle: '1v1 · Finalist vs Wildcard',
      matchLabels: ['Finale'],
    }),
  ],
};
