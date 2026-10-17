import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { getFormat, TournamentFormat } from '../../formats';
import { isPhaseRevealed, isSpinRevealed, playerMap, TournamentState } from '../../engine/tournament';
import { BracketView } from './BracketView';
import { MatchStage } from './MatchStage';
import { WheelOfFortune } from './WheelOfFortune';
import { useNow } from './ScaledStage';

/** Inhalt der 1920×1080-Bühne im Turniermodus (Overlay und Control-Vorschau). */
export const TournamentStage: React.FC<{ celebrate?: boolean }> = ({ celebrate = true }) => {
  const tournament = useStore(s => s.tournament);
  const overlayView = useStore(s => s.overlayView);
  const format = getFormat(tournament?.formatId);

  // Uhr läuft nur, solange ein Glücksrad animiert
  const spinning =
    !!tournament &&
    Object.values(tournament.phases).some(ps => ps.wheel?.spins.some(s => !isSpinRevealed(s, Date.now())));
  const now = useNow(spinning);

  if (!tournament || !format) return <IdleScreen />;

  const lastPhase = format.phases[format.phases.length - 1];
  const championRevealed = !!tournament.championIds && isPhaseRevealed(tournament, format, lastPhase.id, now);

  if (overlayView === 'bracket') return <BracketView tournament={tournament} format={format} now={now} />;
  if (championRevealed) return <ChampionScreen tournament={tournament} format={format} celebrate={celebrate} />;
  return <FocusView tournament={tournament} format={format} now={now} />;
};

const FocusView: React.FC<{ tournament: TournamentState; format: TournamentFormat; now: number }> = ({
  tournament,
  format,
  now,
}) => {
  const def = format.phases.find(p => p.id === tournament.focus.phaseId) ?? format.phases[0];
  const ps = tournament.phases[def.id];
  if (ps.status === 'pending' || !isPhaseRevealed(tournament, format, def.id, now)) {
    return <BracketView tournament={tournament} format={format} now={now} />;
  }
  if (def.kind === 'wheel') {
    return <WheelOfFortune def={def} ps={ps} players={playerMap(tournament)} now={now} formatName={format.name} />;
  }
  const match = ps.matches![Math.min(tournament.focus.matchIdx, ps.matches!.length - 1)];
  return <MatchStage phase={def} match={match} formatName={format.name} />;
};

const ChampionScreen: React.FC<{ tournament: TournamentState; format: TournamentFormat; celebrate: boolean }> = ({
  tournament,
  format,
  celebrate,
}) => {
  const players = playerMap(tournament);
  const names = (tournament.championIds ?? []).map(id => players.get(id)?.name ?? '?');

  useEffect(() => {
    if (!celebrate) return;
    const colors = ['#fbbf24', '#f59e0b', '#fde68a', '#38bdf8', '#f43f5e'];
    const burst = () => {
      confetti({ particleCount: 90, angle: 60, spread: 70, origin: { x: 0, y: 0.7 }, colors });
      confetti({ particleCount: 90, angle: 120, spread: 70, origin: { x: 1, y: 0.7 }, colors });
    };
    burst();
    const id = setInterval(burst, 2500);
    const stop = setTimeout(() => clearInterval(id), 20000);
    return () => {
      clearInterval(id);
      clearTimeout(stop);
    };
  }, [celebrate, tournament.id]);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center text-center select-none bg-[radial-gradient(ellipse_at_center,rgba(251,191,36,0.18),transparent_65%)]">
      <Trophy size={180} className="text-amber-300 drop-shadow-[0_0_40px_rgba(251,191,36,0.6)]" />
      <div className="mt-8 text-[30px] font-mono tracking-[0.5em] text-amber-200/80 uppercase">{format.name}</div>
      <div className="mt-2 text-[150px] leading-none font-black text-white drop-shadow-[0_6px_30px_rgba(0,0,0,0.9)]">
        {names.join(' & ')}
      </div>
      <div className="mt-6 px-10 py-3 rounded-full bg-amber-400 text-black text-[52px] font-black tracking-[0.25em] uppercase">
        {format.championTitle}
      </div>
    </div>
  );
};

const IdleScreen: React.FC = () => (
  <div className="w-full h-full flex flex-col items-center justify-center text-center select-none">
    <div className="text-[28px] font-mono tracking-[0.5em] text-slate-500 uppercase">Role Bravery</div>
    <div className="mt-4 text-[72px] font-extrabold text-slate-200">Gleich geht's los …</div>
  </div>
);
