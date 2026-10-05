import React, { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { AssignedPlayer } from '../types';
import { ROLE_LABELS, RoleIcon } from './RoleIcon';
import confetti from 'canvas-confetti';
import {
  ChevronLeft,
  ChevronRight,
  Dices,
  RefreshCw,
  Copy,
  Check,
  Maximize2,
  Minimize2,
} from 'lucide-react';

interface BroadcastViewProps {
  onGoToPanel: () => void;
  isOverlayOnly?: boolean;
}

export const BroadcastView: React.FC<BroadcastViewProps> = ({
  onGoToPanel,
  isOverlayOnly = false,
}) => {
  const {
    matches,
    activeMatchIndex,
    setActiveMatchIndex,
    rerollEntireMatch,
    rerollChampionsOnly,
    rerollPlayerChampion,
    generateDraft,
    players,
    benchPlayers,
  } = useStore();

  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Auto-generate draft if players exist and no matches yet
  useEffect(() => {
    if (matches.length === 0 && players.length >= 10) {
      generateDraft();
    }
  }, [matches.length, players.length, generateDraft]);

  // Keyboard navigation: ArrowLeft and ArrowRight to switch matches
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key === 'ArrowLeft') {
        setActiveMatchIndex(Math.max(0, activeMatchIndex - 1));
      } else if (e.key === 'ArrowRight') {
        setActiveMatchIndex(Math.min(matches.length - 1, activeMatchIndex + 1));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeMatchIndex, matches.length, setActiveMatchIndex]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const currentMatch = matches[activeMatchIndex];

  const triggerConfetti = () => {
    confetti({
      particleCount: 40,
      spread: 60,
      origin: { y: 0.5 },
      colors: ['#60a5fa', '#f87171', '#e2e8f0']
    });
  };

  const handleRerollEntire = () => {
    rerollEntireMatch(activeMatchIndex);
    triggerConfetti();
  };

  const handleRerollChampions = () => {
    rerollChampionsOnly(activeMatchIndex);
  };

  const copyMatchToClipboard = () => {
    if (!currentMatch) return;
    const blueLines = currentMatch.blueTeam.players
      .map(p => `  • [${ROLE_LABELS[p.role].toUpperCase().padEnd(7)}] ${p.player.name.padEnd(16)} -> ${p.champion.name}`)
      .join('\n');
    const redLines = currentMatch.redTeam.players
      .map(p => `  • [${ROLE_LABELS[p.role].toUpperCase().padEnd(7)}] ${p.player.name.padEnd(16)} -> ${p.champion.name}`)
      .join('\n');

    const text = `MATCH ${activeMatchIndex + 1}/${matches.length}
────────────────────────────────────────
BLUE SIDE:
${blueLines}

RED SIDE:
${redLines}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!currentMatch) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] p-8 text-center bg-[#0e1015]">
        <div className="p-8 rounded-xl bg-[#15171e] border border-[#252833] max-w-md w-full shadow-2xl">
          <h2 className="text-lg font-bold font-sans text-white mb-2 tracking-wide uppercase">
            Kein Match aktiv
          </h2>
          <p className="text-xs text-slate-400 mb-6 leading-relaxed">
            {players.length < 10
              ? `Es sind aktuell nur ${players.length} von 10 benötigten Spielern eingetragen.`
              : 'Starte den Draft, um die 5v5-Teams aufzuteilen.'}
          </p>
          <div className="flex flex-col gap-2.5">
            {players.length >= 10 && (
              <button
                onClick={() => generateDraft()}
                className="w-full py-2.5 rounded-lg bg-slate-700 hover:bg-slate-600 font-bold text-white text-xs tracking-wider uppercase transition-all shadow-lg"
              >
                Draft starten
              </button>
            )}
            <button
              onClick={onGoToPanel}
              className="w-full py-2.5 rounded-lg bg-[#1e212b] hover:bg-[#282c39] text-slate-300 text-xs font-semibold border border-[#2c303e] transition-colors"
            >
              Zum Spieler-Panel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`w-full flex flex-col items-center justify-center select-none bg-[#0a0b0e] text-slate-100 ${
        isOverlayOnly ? 'p-0 h-screen' : 'p-2 sm:p-4'
      }`}
    >
      {/* 16:9 Canvas Container (Matte Grautöne / Dark Neutral Charcoal) */}
      <div
        className={`w-full max-w-[1720px] bg-[#0e1015] ${
          isOverlayOnly
            ? 'h-screen max-h-none rounded-none border-none'
            : 'aspect-[16/9] min-h-[640px] max-h-[92vh] border border-[#21242d] rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.85)]'
        } relative flex flex-col justify-between overflow-hidden`}
      >
        {/* TOP BAR / CONTROLS: 3-Spalten Layout (Links leer, Mitte zentriert, Rechts Controls) */}
        <header className="relative z-20 w-full px-6 py-2.5 border-b border-[#21242e] bg-[#12141a] grid grid-cols-12 items-center shrink-0">
          {/* Links: Leer lassen (Anforderung: Text "tournament draft" einfach weg, leer lassen) */}
          <div className="col-span-3" />

          {/* Mitte: Exakt zentriert mit der Mittelachse des Spielfelds */}
          <div className="col-span-6 flex justify-center items-center">
            <div className="flex items-center gap-2 bg-[#191c24] border border-[#2a2d39] rounded-full px-3 py-1 shadow-inner">
              <button
                onClick={() => setActiveMatchIndex(Math.max(0, activeMatchIndex - 1))}
                disabled={activeMatchIndex === 0}
                className="p-1 rounded-full text-slate-400 hover:text-white disabled:opacity-20 transition-colors"
                title="Vorheriges Match (◄)"
              >
                <ChevronLeft size={16} />
              </button>

              <span className="text-xs font-mono font-bold tracking-widest text-slate-200 px-3 min-w-[95px] text-center">
                MATCH {activeMatchIndex + 1} / {matches.length}
              </span>

              <button
                onClick={() => setActiveMatchIndex(Math.min(matches.length - 1, activeMatchIndex + 1))}
                disabled={activeMatchIndex >= matches.length - 1}
                className="p-1 rounded-full text-slate-400 hover:text-white disabled:opacity-20 transition-colors"
                title="Nächstes Match (►)"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Rechts: Funktionstasten */}
          <div className="col-span-3 flex items-center justify-end gap-2">
            <button
              onClick={handleRerollChampions}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#1a1d26] hover:bg-[#232733] text-slate-200 border border-[#2d3240] shadow-sm transition-all active:scale-95"
              title="Behält Teams bei, würfelt Champions neu"
            >
              <Dices size={14} className="text-slate-300" />
              <span>Champions Reroll</span>
            </button>

            <button
              onClick={handleRerollEntire}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#222530] hover:bg-[#2b2f3d] text-slate-200 border border-[#353a4b] shadow-sm transition-all active:scale-95"
              title="Komplettes Match neu mischen"
            >
              <RefreshCw size={13} className="text-slate-300" />
              <span>Match Neu</span>
            </button>

            <button
              onClick={copyMatchToClipboard}
              className="p-1.5 rounded-full bg-[#181a22] hover:bg-[#222530] text-slate-300 border border-[#282c38] transition-colors"
              title="Match-Aufstellung kopieren"
            >
              {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
            </button>

            <button
              onClick={toggleFullscreen}
              className="p-1.5 rounded-full bg-[#181a22] hover:bg-[#222530] text-slate-300 border border-[#282c38] transition-colors"
              title="Fullscreen umschalten (F11)"
            >
              {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </button>
          </div>
        </header>

        {/* MAIN STAGE (5 Slots Left, Center Hub, 5 Slots Right) */}
        <div className="relative z-10 flex-1 px-4 sm:px-6 py-2 sm:py-3 flex flex-col justify-between overflow-hidden">
          {/* TEAM HEADERS ROW */}
          <div className="grid grid-cols-12 gap-3 sm:gap-4 items-center mb-1.5 shrink-0">
            {/* Blue Side Label */}
            <div className="col-span-5 flex items-center gap-2 px-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#38bdf8]" />
              <span className="text-[13px] font-sans font-bold text-[#38bdf8] tracking-widest uppercase">
                BLUE SIDE
              </span>
            </div>

            {/* Center Header Space (Exakt zentriert mit oberer Match-Auswahl) */}
            <div className="col-span-2 text-center" />

            {/* Red Side Label */}
            <div className="col-span-5 flex items-center justify-end gap-2 px-1">
              <span className="text-[13px] font-sans font-bold text-[#f43f5e] tracking-widest uppercase">
                RED SIDE
              </span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#f43f5e]" />
            </div>
          </div>

          {/* MAIN 5V5 SLOTS & CENTER CONTENT */}
          <div className="grid grid-cols-12 gap-3 sm:gap-4 items-center flex-1 my-auto">
            {/* LEFT COLUMN: BLUE SIDE 5 SPLASH SLOTS (Legit fast kein Abstand, 2-3px gap, nahtlos gestapelt) */}
            <div className="col-span-5 flex flex-col gap-1 sm:gap-1.5 justify-center">
              {currentMatch.blueTeam.players.map((ap) => (
                <BlueSplashCard
                  key={ap.player.id}
                  assignedPlayer={ap}
                  onReroll={() => rerollPlayerChampion(activeMatchIndex, 'blue', ap.player.id)}
                />
              ))}
            </div>

            {/* CENTER COLUMN: Exakt zentriert, aufgeräumt, keine Elo/Diff-Anzeige */}
            <div className="col-span-2 flex flex-col items-center justify-center text-center my-auto px-1 py-2">
              {/* VS Emblem */}
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#151720] border border-[#2c303e] shadow-[0_0_20px_rgba(0,0,0,0.6)] flex items-center justify-center">
                <span className="text-[18px] sm:text-[20px] font-sans font-extrabold text-slate-200 tracking-wider">
                  VS
                </span>
              </div>

              {/* Bench notification if any */}
              {benchPlayers.length > 0 && (
                <div className="mt-4 px-2.5 py-1 rounded bg-[#181a24] border border-[#2a2e3a] text-[11px] text-slate-400 max-w-[140px] truncate">
                  <span className="text-slate-200 font-semibold">{benchPlayers.length}</span> auf Bank
                </div>
              )}
            </div>

            {/* RIGHT COLUMN: RED SIDE 5 SPLASH SLOTS (Legit fast kein Abstand, 2-3px gap, nahtlos gestapelt) */}
            <div className="col-span-5 flex flex-col gap-1 sm:gap-1.5 justify-center">
              {currentMatch.redTeam.players.map((ap) => (
                <RedSplashCard
                  key={ap.player.id}
                  assignedPlayer={ap}
                  onReroll={() => rerollPlayerChampion(activeMatchIndex, 'red', ap.player.id)}
                />
              ))}
            </div>
          </div>

          {/* BOTTOM SUBTLE FOOTER (Bans entfernt) */}
          <div className="pt-2 border-t border-[#1c1f29] flex items-center justify-between text-[11px] text-slate-500 font-sans shrink-0">
            <div>
              OBS Source: <span className="text-slate-400 font-mono">1920x1080</span> • Pfeiltasten <kbd className="px-1 py-0.5 rounded bg-[#181a22] border border-[#262a36] text-slate-300 font-mono">◄</kbd> <kbd className="px-1 py-0.5 rounded bg-[#181a22] border border-[#262a36] text-slate-300 font-mono">►</kbd> zum Match-Wechsel
            </div>
            {!isOverlayOnly && (
              <button
                onClick={onGoToPanel}
                className="text-slate-400 hover:text-slate-200 transition-colors underline"
              >
                Spieler-Panel aufrufen →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────────────
   BLUE SIDE SPLASH CARD (Wie im Bild: Vollflächiges Splash Art Banner)
   - Größere Höhe & minimale Innenabstände für maximal sichtbares Splashart
   - Links: Original League Role Icon + Champion Name
   - Rechts: Spielername in fettem, scharfem Weiß
────────────────────────────────────────────────────────────────────────── */
interface CardProps {
  assignedPlayer: AssignedPlayer;
  onReroll: () => void;
}

const BlueSplashCard: React.FC<CardProps> = ({ assignedPlayer, onReroll }) => {
  const { player, role, champion } = assignedPlayer;

  return (
    <div className="group relative h-[90px] sm:h-[105px] lg:h-[118px] rounded-[3px] overflow-hidden border border-[#262a36] hover:border-[#38bdf8]/80 shadow-md transition-all duration-150 bg-[#12141a]">
      {/* Full Background Champion Splash Artwork (wie im Bild) */}
      <img
        src={champion.splashImage}
        alt={champion.name}
        className="absolute inset-0 w-full h-full object-cover object-[center_25%] filter brightness-95 group-hover:scale-105 transition-transform duration-500"
        onError={(e) => {
          (e.target as HTMLImageElement).src = champion.image;
        }}
      />

      {/* Sehr dezenter Schatten nur an den Rändern für perfekte Lesbarkeit des Texts */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-transparent to-black/75 pointer-events-none" />

      {/* Card Content Overlay */}
      <div className="relative z-10 h-full px-3 py-1 flex items-center justify-between">
        {/* Links: Original League Role Icon + Champion Name */}
        <div className="flex items-center gap-2">
          <div className="p-1 rounded bg-black/60 border border-slate-700/50 shadow flex items-center justify-center shrink-0">
            <RoleIcon role={role} size={20} />
          </div>

          <div>
            <div className="text-[10px] font-mono tracking-wider text-[#38bdf8] uppercase font-semibold">
              {ROLE_LABELS[role]}
            </div>
            <div className="text-xs sm:text-sm font-sans font-bold text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] truncate max-w-[140px]">
              {champion.name}
            </div>
          </div>
        </div>

        {/* Rechts (Innenseite zum VS): Spielername + Reroll Symbol */}
        <div className="flex items-center gap-2.5">
          <span className="font-sans font-bold text-[15px] sm:text-[17px] text-white tracking-wide drop-shadow-[0_1px_4px_rgba(0,0,0,0.95)] truncate max-w-[170px]">
            {player.name}
          </span>

          {/* Reroll Symbol: immer auf der Innenseite, dezent sichtbar, bei Hover hervorgehoben */}
          <button
            type="button"
            onClick={onReroll}
            className="w-6 h-6 rounded-md bg-black/60 hover:bg-black/90 border border-slate-600/70 hover:border-slate-300 text-slate-300 hover:text-white transition-all flex items-center justify-center shadow-sm"
            title={`${champion.name} neu würfeln`}
          >
            <Dices size={13} />
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────────────
   RED SIDE SPLASH CARD (Wie im Bild: Vollflächiges Splash Art Banner)
   - Links (Innenseite zum VS): Reroll Symbol + Spielername
   - Rechts (Außenseite): Original League Role Icon + Champion Name
────────────────────────────────────────────────────────────────────────── */
const RedSplashCard: React.FC<CardProps> = ({ assignedPlayer, onReroll }) => {
  const { player, role, champion } = assignedPlayer;

  return (
    <div className="group relative h-[90px] sm:h-[105px] lg:h-[118px] rounded-[3px] overflow-hidden border border-[#32252a] hover:border-[#f43f5e]/80 shadow-md transition-all duration-150 bg-[#171214]">
      {/* Full Background Champion Splash Artwork (wie im Bild) */}
      <img
        src={champion.splashImage}
        alt={champion.name}
        className="absolute inset-0 w-full h-full object-cover object-[center_25%] filter brightness-95 group-hover:scale-105 transition-transform duration-500"
        onError={(e) => {
          (e.target as HTMLImageElement).src = champion.image;
        }}
      />

      {/* Sehr dezenter Schatten nur an den Rändern für perfekte Lesbarkeit des Texts */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-transparent to-black/75 pointer-events-none" />

      {/* Card Content Overlay */}
      <div className="relative z-10 h-full px-3 py-1 flex items-center justify-between">
        {/* Links (Innenseite zum VS): Reroll Symbol + Spielername */}
        <div className="flex items-center gap-2.5">
          {/* Reroll Symbol: immer auf der Innenseite, dezent sichtbar, bei Hover hervorgehoben */}
          <button
            type="button"
            onClick={onReroll}
            className="w-6 h-6 rounded-md bg-black/60 hover:bg-black/90 border border-slate-600/70 hover:border-slate-300 text-slate-300 hover:text-white transition-all flex items-center justify-center shadow-sm"
            title={`${champion.name} neu würfeln`}
          >
            <Dices size={13} />
          </button>

          <span className="font-sans font-bold text-[15px] sm:text-[17px] text-white tracking-wide drop-shadow-[0_1px_4px_rgba(0,0,0,0.95)] truncate max-w-[170px]">
            {player.name}
          </span>
        </div>

        {/* Rechts (Außenseite): Original League Role Icon + Champion Name */}
        <div className="flex items-center gap-2 text-right">
          <div>
            <div className="text-[10px] font-mono tracking-wider text-[#f43f5e] uppercase font-semibold">
              {ROLE_LABELS[role]}
            </div>
            <div className="text-xs sm:text-sm font-sans font-bold text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] truncate max-w-[140px]">
              {champion.name}
            </div>
          </div>

          <div className="p-1 rounded bg-black/60 border border-slate-700/50 shadow flex items-center justify-center shrink-0">
            <RoleIcon role={role} size={20} />
          </div>
        </div>
      </div>
    </div>
  );
};
