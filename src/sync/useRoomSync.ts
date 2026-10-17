import { useEffect } from 'react';
import { create } from 'zustand';
import { AppState, useStore } from '../store/useStore';
import { isFirebaseConfigured, openRoom } from './firebase';
import { isOverlayMode, resolveRoomId } from './room';

export type SyncStatus = 'local' | 'connecting' | 'online' | 'offline' | 'error';

interface SyncState {
  status: SyncStatus;
  roomId: string | null;
  error: string | null;
  /** Overlay: wurden schon Daten empfangen? */
  received: boolean;
}

export const useSyncStore = create<SyncState>(() => ({
  status: isFirebaseConfigured ? 'connecting' : 'local',
  roomId: null,
  error: null,
  received: false,
}));

/** Der Teil des States, den das Overlay braucht. */
export type SyncPayload = Pick<
  AppState,
  'appMode' | 'tournament' | 'overlayView' | 'matches' | 'benchPlayers' | 'activeMatchIndex'
>;

export const pickPayload = (s: AppState): SyncPayload => ({
  appMode: s.appMode,
  tournament: s.tournament,
  overlayView: s.overlayView,
  matches: s.matches,
  benchPlayers: s.benchPlayers,
  activeMatchIndex: s.activeMatchIndex,
});

const applyPayload = (p: Partial<SyncPayload>) => {
  useStore.setState({
    appMode: p.appMode ?? 'lobby',
    tournament: p.tournament ?? null,
    overlayView: p.overlayView ?? 'match',
    matches: p.matches ?? [],
    benchPlayers: p.benchPlayers ?? [],
    activeMatchIndex: p.activeMatchIndex ?? 0,
  });
  useSyncStore.setState({ received: true });
};

const parse = (raw: string | null | undefined): Partial<SyncPayload> | null => {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

/**
 * Control-Panel: schreibt Änderungen (entprellt) nach rooms/<id>.
 * Overlay: abonniert rooms/<id> read-only. Ohne Firebase liest das
 * Overlay den LocalStorage desselben Browsers (storage-Event).
 */
export function useRoomSync() {
  useEffect(() => {
    if (!isFirebaseConfigured) {
      if (!isOverlayMode) return;
      // Lokaler Fallback: gleiches Browser-Profil, anderes Fenster
      const readLocal = () => {
        try {
          const raw = localStorage.getItem('role-bravery-storage-v2');
          const state = raw ? JSON.parse(raw).state : null;
          if (state) applyPayload(state);
        } catch {
          /* ignore */
        }
      };
      readLocal();
      const onStorage = (e: StorageEvent) => e.key === 'role-bravery-storage-v2' && readLocal();
      window.addEventListener('storage', onStorage);
      return () => window.removeEventListener('storage', onStorage);
    }

    const roomId = resolveRoomId();
    useSyncStore.setState({ roomId });
    if (!roomId) {
      useSyncStore.setState({ status: 'error', error: 'Keine Raum-ID in der URL (?room=…).' });
      return;
    }

    let disposed = false;
    const cleanups: (() => void)[] = [];
    const fail = (e: unknown) =>
      useSyncStore.setState({ status: 'error', error: e instanceof Error ? e.message : String(e) });

    openRoom(roomId)
      .then(async room => {
        if (disposed) return;
        cleanups.push(
          room.onConnectionChange(connected => useSyncStore.setState({ status: connected ? 'online' : 'offline' }))
        );

        if (isOverlayMode) {
          cleanups.push(
            room.subscribe(rec => {
              const p = parse(rec?.payload);
              if (p) applyPayload(p);
            }, fail)
          );
          return;
        }

        // Control: Ist lokal nichts los, aber der Raum hat Daten (z. B. anderes
        // Gerät), wird der Raum-Stand übernommen. Sonst gewinnt der lokale Stand.
        const remote = parse((await room.read())?.payload);
        const local = useStore.getState();
        if (remote && !local.tournament && local.matches.length === 0) applyPayload(remote);
        if (disposed) return;

        let last = '';
        let timer: ReturnType<typeof setTimeout> | undefined;
        const push = () => {
          const json = JSON.stringify(pickPayload(useStore.getState()));
          if (json === last) return;
          last = json;
          room.write(json).catch(fail);
        };
        push();
        cleanups.push(
          useStore.subscribe(() => {
            clearTimeout(timer);
            timer = setTimeout(push, 120);
          })
        );
        cleanups.push(() => clearTimeout(timer));
      })
      .catch(fail);

    return () => {
      disposed = true;
      cleanups.forEach(fn => fn());
    };
  }, []);
}
