import React, { useEffect } from 'react';
import { useStore } from '../store/useStore';
import { useRoomSync, useSyncStore } from '../sync/useRoomSync';
import { isTransparentOverlay } from '../sync/room';
import { isFirebaseConfigured } from '../sync/firebase';
import { ScaledStage } from './tournament/ScaledStage';
import { TournamentStage } from './tournament/TournamentStage';
import { BroadcastView } from './BroadcastView';

/** OBS-Browserquelle: randlos, read-only, 1920×1080. */
export const OverlayApp: React.FC = () => {
  useRoomSync();
  const appMode = useStore(s => s.appMode);
  const { status, error, received } = useSyncStore();

  useEffect(() => {
    document.body.classList.add('overflow-hidden');
    if (isTransparentOverlay) {
      document.documentElement.style.background = 'transparent';
      document.body.style.background = 'transparent';
      document.body.classList.remove('bg-[#0b0c10]');
    }
  }, []);

  return (
    <div className="w-screen h-screen">
      <ScaledStage className="w-full h-full" transparent={isTransparentOverlay}>
        {appMode === 'classic' ? <BroadcastView onGoToPanel={() => {}} readOnly /> : <TournamentStage />}
        {isFirebaseConfigured && !received && (
          <div className="absolute bottom-6 left-6 px-4 py-2 rounded-md bg-black/70 text-[18px] font-mono text-slate-400">
            {status === 'error' ? `Sync-Fehler: ${error}` : 'Verbinde mit Raum …'}
          </div>
        )}
      </ScaledStage>
    </div>
  );
};
