import React from 'react';
import { Crown, Swords } from 'lucide-react';
import { MatchPhaseDef } from '../../formats/types';
import { TMatch } from '../../engine/tournament';
import { TSlot, TTeam } from '../../engine/teams';
import { ROLE_LABELS, RoleIcon } from '../RoleIcon';

const SIDE = [
  { accent: '#38bdf8', label: 'BLUE SIDE', border: 'border-[#262a36]' },
  { accent: '#f43f5e', label: 'RED SIDE', border: 'border-[#32252a]' },
];

/**
 * Match-Ansicht für die 1920×1080-Bühne – funktioniert für 5v5, 2v2 und 1v1,
 * mit Bravery-Champions (Splash Art) oder freier Champion-Wahl.
 */
export const MatchStage: React.FC<{ phase: MatchPhaseDef; match: TMatch; formatName: string }> = ({
  phase,
  match,
  formatName,
}) => {
  const isBravery = phase.championMode === 'bravery';
  return (
    <div className="w-full h-full flex flex-col px-14 py-10 text-slate-100 select-none">
      {/* Kopfzeile */}
      <div className="flex items-end justify-between mb-6 shrink-0">
        <div>
          <div className="text-[20px] font-mono tracking-[0.3em] text-slate-500 uppercase">{formatName}</div>
          <div className="text-[56px] leading-none font-extrabold tracking-wide uppercase">{match.label}</div>
        </div>
        <div className="text-right">
          <div className="text-[26px] font-bold text-slate-300 uppercase tracking-widest">{phase.label}</div>
          <div
            className={`mt-2 inline-block px-4 py-1.5 rounded-full text-[18px] font-bold tracking-widest uppercase border ${
              isBravery
                ? 'bg-amber-500/10 text-amber-300 border-amber-500/40'
                : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/40'
            }`}
          >
            {isBravery ? 'Bravery Draft' : 'Freie Champion-Wahl'}
          </div>
        </div>
      </div>

      {/* Teams */}
      <div className="flex-1 min-h-0 grid grid-cols-[1fr_180px_1fr] gap-6">
        {match.teams.map((team, ti) => (
          <React.Fragment key={ti}>
            {ti === 1 && (
              <div className="flex items-center justify-center">
                <div className="w-[130px] h-[130px] rounded-full bg-[#151720] border-2 border-[#2c303e] shadow-[0_0_40px_rgba(0,0,0,0.7)] flex items-center justify-center">
                  <span className="text-[44px] font-extrabold tracking-wider text-slate-200">VS</span>
                </div>
              </div>
            )}
            <TeamColumn team={team} side={ti} winner={match.winner} />
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

const TeamColumn: React.FC<{ team: TTeam; side: number; winner: number | null }> = ({ team, side, winner }) => {
  const s = SIDE[side];
  const won = winner === side;
  const lost = winner !== null && !won;
  const mirrored = side === 1;
  return (
    <div className={`flex flex-col min-h-0 transition-opacity duration-500 ${lost ? 'opacity-35 grayscale' : ''}`}>
      <div className={`flex items-center gap-3 mb-3 shrink-0 ${mirrored ? 'flex-row-reverse' : ''}`}>
        <span className="w-4 h-4 rounded-full" style={{ background: s.accent }} />
        <span className="text-[30px] font-extrabold tracking-widest uppercase" style={{ color: s.accent }}>
          {team.name}
        </span>
        <span className="text-[18px] font-mono text-slate-500 tracking-widest">{s.label}</span>
        {won && (
          <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400 text-black text-[18px] font-black tracking-widest">
            <Crown size={20} /> SIEGER
          </span>
        )}
      </div>
      <div
        className={`flex-1 min-h-0 flex flex-col gap-2 rounded-md ${won ? 'ring-4 ring-amber-400/80 p-1.5' : ''}`}
      >
        {team.slots.map(slot => (
          <SlotCard key={slot.player.id} slot={slot} side={side} large={team.slots.length <= 2} />
        ))}
      </div>
    </div>
  );
};

const SlotCard: React.FC<{ slot: TSlot; side: number; large: boolean }> = ({ slot, side, large }) => {
  const s = SIDE[side];
  const mirrored = side === 1;
  const { player, role, champion } = slot;
  return (
    <div className={`relative flex-1 min-h-0 rounded-[4px] overflow-hidden border ${s.border} bg-[#12141a]`}>
      {champion ? (
        <>
          <img
            src={champion.splashImage}
            alt={champion.name}
            className="absolute inset-0 w-full h-full object-cover object-[center_25%]"
            onError={e => {
              (e.target as HTMLImageElement).src = champion.image;
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-black/80" />
        </>
      ) : (
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(${mirrored ? 270 : 90}deg, ${s.accent}22 0%, #12141a 55%, #0d0f14 100%)`,
          }}
        />
      )}
      <div className={`relative z-10 h-full px-6 flex items-center justify-between ${mirrored ? 'flex-row-reverse' : ''}`}>
        <div className={`flex items-center gap-4 ${mirrored ? 'flex-row-reverse text-right' : ''}`}>
          {role && (
            <div className="p-1.5 rounded bg-black/60 border border-slate-700/50">
              <RoleIcon role={role} size={34} />
            </div>
          )}
          <div>
            {role && (
              <div className="text-[15px] font-mono tracking-wider uppercase font-semibold" style={{ color: s.accent }}>
                {ROLE_LABELS[role]}
              </div>
            )}
            {champion ? (
              <div className="text-[24px] font-bold text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
                {champion.name}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-[20px] font-bold text-emerald-300/90 tracking-widest uppercase">
                <Swords size={22} /> Free Pick
              </div>
            )}
          </div>
        </div>
        <span
          className={`font-bold text-white tracking-wide drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)] truncate ${
            large ? 'text-[64px]' : 'text-[32px]'
          }`}
        >
          {player.name}
        </span>
      </div>
    </div>
  );
};
