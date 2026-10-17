import { TournamentFormat } from './types';
import { fillmastersSquidGame } from './fillmastersSquidGame';

export * from './types';

/**
 * Registry aller Turnierformate. Neues Format: Datei in diesem Ordner
 * anlegen und hier eintragen – siehe README "Neues Turnierformat anlegen".
 */
export const TOURNAMENT_FORMATS: TournamentFormat[] = [fillmastersSquidGame];

export const getFormat = (id: string | undefined): TournamentFormat | undefined =>
  TOURNAMENT_FORMATS.find(f => f.id === id);

/** Prüft ein Format auf offensichtliche Konfigurationsfehler. */
export function validateFormat(format: TournamentFormat): string[] {
  const errors: string[] = [];
  const seen = new Map<string, TournamentFormat['phases'][number]>();
  for (const phase of format.phases) {
    if (seen.has(phase.id)) errors.push(`Phase "${phase.id}" ist doppelt.`);
    for (const src of phase.sources) {
      if ('entrants' in src) continue;
      const ref = seen.get(src.phase);
      if (!ref) {
        errors.push(`Phase "${phase.id}" referenziert "${src.phase}", die nicht vorher definiert ist.`);
      } else if (ref.kind === 'match' && (src.take === 'picked' || src.take === 'rest')) {
        errors.push(`Phase "${phase.id}": "${src.take}" gibt es nur bei Glücksrad-Phasen.`);
      } else if (ref.kind === 'wheel' && (src.take === 'winners' || src.take === 'losers')) {
        errors.push(`Phase "${phase.id}": "${src.take}" gibt es nur bei Match-Phasen.`);
      }
    }
    seen.set(phase.id, phase);
  }
  if (format.phases.length === 0) errors.push('Format hat keine Phasen.');
  return errors;
}
