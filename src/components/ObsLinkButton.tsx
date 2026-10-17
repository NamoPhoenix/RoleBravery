import React, { useState } from 'react';
import { Check, Link2 } from 'lucide-react';
import { useSyncStore } from '../sync/useRoomSync';
import { buildOverlayUrl } from '../sync/room';
import { isFirebaseConfigured } from '../sync/firebase';

const STATUS_STYLE: Record<string, { dot: string; label: string }> = {
  local: { dot: 'bg-slate-500', label: 'Nur lokal (keine Firebase-Config)' },
  connecting: { dot: 'bg-amber-400 animate-pulse', label: 'Verbinde …' },
  online: { dot: 'bg-emerald-400', label: 'Live-Sync aktiv' },
  offline: { dot: 'bg-amber-500', label: 'Offline – Änderungen werden nachgesendet' },
  error: { dot: 'bg-rose-500', label: 'Sync-Fehler' },
};

/** Sync-Status + "OBS-Link kopieren". */
export const ObsLinkButton: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { status, roomId, error } = useSyncStore();
  const [copied, setCopied] = useState(false);
  const st = STATUS_STYLE[status];

  const copy = async () => {
    await navigator.clipboard.writeText(buildOverlayUrl(roomId));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center gap-2">
      <span
        className="flex items-center gap-1.5 text-[11px] text-slate-400"
        title={error ? `${st.label}: ${error}` : isFirebaseConfigured ? `${st.label} · Raum ${roomId ?? '-'}` : st.label}
      >
        <span className={`w-2 h-2 rounded-full ${st.dot}`} />
        {!compact && <span className="hidden lg:inline">{st.label}</span>}
      </span>
      <button
        type="button"
        onClick={copy}
        className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-700 transition-colors"
        title={
          isFirebaseConfigured
            ? 'Overlay-URL für die OBS-Browserquelle (1920×1080) kopieren'
            : 'Ohne Firebase funktioniert das Overlay nur im selben Browser'
        }
      >
        {copied ? <Check size={13} className="text-emerald-400" /> : <Link2 size={13} className="text-sky-400" />}
        <span>{copied ? 'Kopiert!' : 'OBS-Link kopieren'}</span>
      </button>
    </div>
  );
};
