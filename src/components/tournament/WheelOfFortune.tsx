import React, { useEffect, useState } from 'react';
import { Player } from '../../types';
import { WheelPhaseDef } from '../../formats/types';
import { isSpinRevealed, PhaseState, SPIN_MS, WheelSpin } from '../../engine/tournament';

const COLORS = ['#0ea5e9', '#f43f5e', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];
const TURNS = 8;
const R = 400;

const targetRotation = (spin: WheelSpin) => {
  const seg = 360 / spin.segmentIds.length;
  const k = spin.segmentIds.indexOf(spin.targetId);
  return 360 * TURNS - (k + 0.5 + spin.jitter) * seg;
};

/** Glücksrad für die 1920×1080-Bühne. Ergebnis kommt aus dem State, das Rad animiert nur dorthin. */
export const WheelOfFortune: React.FC<{
  def: WheelPhaseDef;
  ps: PhaseState;
  players: Map<string, Player>;
  now: number;
  formatName: string;
}> = ({ def, ps, players, now, formatName }) => {
  const spins = ps.wheel?.spins ?? [];
  const lastSpin = spins[spins.length - 1];
  const spinning = !!lastSpin && !isSpinRevealed(lastSpin, now);
  // Segmente: während/nach einer Drehung die Segmente dieser Drehung, sonst alle Teilnehmer
  const segmentIds = lastSpin ? lastSpin.segmentIds : ps.playerIds;
  const revealed = spins.filter(s => isSpinRevealed(s, now)).map(s => players.get(s.targetId)?.name ?? '?');

  return (
    <div className="w-full h-full flex items-center px-24 gap-20 text-slate-100 select-none">
      <div className="w-[560px] shrink-0">
        <div className="text-[20px] font-mono tracking-[0.3em] text-slate-500 uppercase">{formatName}</div>
        <div className="text-[72px] leading-none font-extrabold uppercase mt-2">{def.label}</div>
        <div className="text-[26px] text-slate-400 mt-4">
          {def.pickCount === 1 ? 'Ein Spieler' : `${def.pickCount} Spieler`} wird per Glücksrad als{' '}
          <span className="text-amber-300 font-bold">{def.pickedLabel ?? 'Gezogener'}</span> gezogen.
        </div>
        <div className="mt-10 space-y-3">
          {revealed.map((name, i) => (
            <div
              key={i}
              className="animate-fade-in px-6 py-4 rounded-lg bg-amber-400/10 border-2 border-amber-400 text-[44px] font-extrabold text-amber-300"
            >
              {name}
              <div className="text-[18px] font-mono tracking-[0.3em] text-amber-200/70 uppercase">
                {def.pickedLabel ?? 'Gezogen'}
              </div>
            </div>
          ))}
          {spinning && <div className="text-[32px] font-bold text-slate-300 animate-pulse">Das Rad dreht sich …</div>}
          {!lastSpin && <div className="text-[28px] text-slate-500">Warte auf den Dreh …</div>}
        </div>
      </div>

      <div className="relative flex-1 flex items-center justify-center">
        <SpinningWheel key={lastSpin?.id ?? 'idle'} spin={lastSpin} segmentIds={segmentIds} players={players} now={now} />
      </div>
    </div>
  );
};

const SpinningWheel: React.FC<{
  spin?: WheelSpin;
  segmentIds: string[];
  players: Map<string, Player>;
  now: number;
}> = ({ spin, segmentIds, players, now }) => {
  const elapsed = spin ? now - spin.at : 0;
  const alreadyDone = !!spin && elapsed >= SPIN_MS;
  const [rotation, setRotation] = useState(alreadyDone && spin ? targetRotation(spin) : 0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    if (!spin || alreadyDone) return;
    const remaining = Math.max(500, SPIN_MS - (Date.now() - spin.at));
    const id = requestAnimationFrame(() => {
      setDuration(remaining);
      setRotation(targetRotation(spin));
    });
    return () => cancelAnimationFrame(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spin?.id]);

  const n = Math.max(segmentIds.length, 1);
  const seg = 360 / n;
  const winnerId = spin && now - spin.at >= SPIN_MS ? spin.targetId : null;

  const arc = (i: number) => {
    const a0 = ((i * seg - 90) * Math.PI) / 180;
    const a1 = (((i + 1) * seg - 90) * Math.PI) / 180;
    const large = seg > 180 ? 1 : 0;
    return `M 0 0 L ${R * Math.cos(a0)} ${R * Math.sin(a0)} A ${R} ${R} 0 ${large} 1 ${R * Math.cos(a1)} ${R * Math.sin(a1)} Z`;
  };

  return (
    <div className="relative" style={{ width: R * 2 + 40, height: R * 2 + 40 }}>
      {/* Zeiger */}
      <div className="absolute left-1/2 -top-2 -translate-x-1/2 z-20">
        <svg width="70" height="80" viewBox="0 0 70 80">
          <path d="M35 78 L5 8 Q35 -6 65 8 Z" fill="#fbbf24" stroke="#0a0b0e" strokeWidth="4" />
        </svg>
      </div>
      <svg
        viewBox={`${-R - 20} ${-R - 20} ${R * 2 + 40} ${R * 2 + 40}`}
        className="w-full h-full drop-shadow-[0_0_60px_rgba(251,191,36,0.15)]"
        style={{
          transform: `rotate(${rotation}deg)`,
          transition: duration ? `transform ${duration}ms cubic-bezier(0.12, 0.75, 0.12, 1)` : 'none',
        }}
      >
        <circle r={R + 14} fill="#12141a" stroke="#2c303e" strokeWidth="6" />
        {segmentIds.length === 1 ? (
          <circle r={R} fill={COLORS[0]} />
        ) : (
          segmentIds.map((id, i) => (
            <path
              key={id}
              d={arc(i)}
              fill={COLORS[i % COLORS.length]}
              opacity={winnerId && winnerId !== id ? 0.35 : 1}
              stroke="#0a0b0e"
              strokeWidth="4"
            />
          ))
        )}
        {segmentIds.map((id, i) => {
          const mid = i * seg + seg / 2;
          return (
            <g key={`t-${id}`} transform={`rotate(${mid}) translate(0 ${-R * 0.58}) rotate(90)`}>
              <text
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#fff"
                fontSize={Math.min(46, 900 / Math.max(n, 4) + 8)}
                fontWeight={800}
                style={{ paintOrder: 'stroke', stroke: 'rgba(0,0,0,0.55)', strokeWidth: 6 }}
              >
                {(players.get(id)?.name ?? '?').slice(0, 16)}
              </text>
            </g>
          );
        })}
        <circle r={70} fill="#0a0b0e" stroke="#fbbf24" strokeWidth="6" />
      </svg>
    </div>
  );
};
