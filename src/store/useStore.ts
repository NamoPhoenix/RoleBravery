import { create } from 'zustand';
import { createJSONStorage, persist, StateStorage } from 'zustand/middleware';
import { Player, ChampionPools, Match, Role, EloRating, ViewMode } from '../types';
import { getFormat, TOURNAMENT_FORMATS } from '../formats';
import {
  createTournament,
  rerollMatchChampions as rerollTournamentMatchChampions,
  rerollPhase as rerollTournamentPhase,
  setMatchWinner as setTournamentMatchWinner,
  spinWheel as spinTournamentWheel,
  TournamentState,
} from '../engine/tournament';
import { isOverlayMode } from '../sync/room';
import { DEFAULT_CHAMPION_POOLS } from '../data/defaultChampions';
import {
  generateMatchesFromPool,
  rerollMatchChampions,
  rerollSinglePlayerChampion,
  balanceTenPlayers
} from '../utils/balancer';

export type AppMode = 'lobby' | 'classic' | 'tournament';
export type OverlayView = 'bracket' | 'match';

const UNDO_LIMIT = 30;

export interface AppState {
  // App-Modus & Turnier
  appMode: AppMode;
  selectedFormatId: string;
  tournament: TournamentState | null;
  tournamentHistory: TournamentState[];
  overlayView: OverlayView;

  // Player Pool
  players: Player[];
  championPools: ChampionPools;
  matches: Match[];
  benchPlayers: Player[];
  activeMatchIndex: number;
  viewMode: ViewMode;

  // Actions - App / Turnier
  setAppMode: (mode: AppMode) => void;
  setSelectedFormatId: (id: string) => void;
  setOverlayView: (view: OverlayView) => void;
  startTournament: () => string | null;
  endTournament: () => void;
  setTournamentFocus: (phaseId: string, matchIdx?: number) => void;
  setMatchWinner: (phaseId: string, matchIdx: number, teamIdx: number) => void;
  spinWheel: (phaseId: string) => void;
  rerollTournamentPhase: (phaseId: string) => void;
  rerollTournamentChampions: (phaseId: string, matchIdx: number, playerId?: string) => void;
  undoTournament: () => void;

  // Actions - Players
  addPlayer: (name: string, elo?: EloRating, roles?: Role[], bans?: string[]) => void;
  removePlayer: (id: string) => void;
  updatePlayer: (id: string, updates: Partial<Omit<Player, 'id'>>) => void;
  bulkImportPlayers: (text: string, defaultElo?: EloRating) => void;
  clearPlayers: () => void;
  loadSamplePlayers: (count?: number) => void;

  // Actions - Champion Pools
  updateChampionPools: (pools: ChampionPools) => void;
  resetChampionPools: () => void;

  // Actions - Draft & Matches
  generateDraft: () => void;
  rerollEntireMatch: (matchIndex: number) => void;
  rerollChampionsOnly: (matchIndex: number) => void;
  rerollPlayerChampion: (matchIndex: number, teamSide: 'blue' | 'red', playerId: string) => void;
  setActiveMatchIndex: (index: number) => void;
  setViewMode: (mode: ViewMode) => void;
  manualSwapPlayers: (
    matchIndex: number,
    source: { side: 'blue' | 'red'; role: Role },
    target: { side: 'blue' | 'red'; role: Role }
  ) => void;
}

const INITIAL_SAMPLE_PLAYERS: Player[] = [
  { id: 'p-1', name: 'FakerFan99', elo: 'high', roles: ['mid', 'top'], bans: ['Zed', 'Yasuo'] },
  { id: 'p-2', name: 'ShadowGank', elo: 'high', roles: ['jgl', 'sup'], bans: ['Shaco'] },
  { id: 'p-3', name: 'SilverSniper', elo: 'low', roles: ['adc', 'mid'], bans: ['Draven'] },
  { id: 'p-4', name: 'WardMachine', elo: 'low', roles: ['sup', 'mid'], bans: ['Blitzcrank'] },
  { id: 'p-5', name: 'IronClad', elo: 'mid', roles: ['top', 'jgl'], bans: ['Darius'] },
  { id: 'p-6', name: 'ArcanePulse', elo: 'mid', roles: ['mid', 'adc'], bans: ['Ahri'] },
  { id: 'p-7', name: 'JungleDiff', elo: 'mid', roles: ['jgl', 'top'], bans: ['Lee Sin'] },
  { id: 'p-8', name: 'CritFisher', elo: 'high', roles: ['adc'], bans: ['Caitlyn'] },
  { id: 'p-9', name: 'HookCity', elo: 'low', roles: ['sup', 'top'], bans: ['Pyke', 'Nautilus'] },
  { id: 'p-10', name: 'BladeDancer', elo: 'mid', roles: ['top', 'mid', 'adc'], bans: ['Irelia'] },
];

// Das Overlay darf den LocalStorage des Control-Panels nie überschreiben.
const memoryStorage: StateStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

export const useStore = create<AppState>()(
  persist(
    (set, get) => {
      /** Turnier-Änderung mit Undo-Snapshot übernehmen. */
      const commitTournament = (next: TournamentState | null) => {
        const prev = get().tournament;
        if (!prev || next === prev) return;
        set(state => ({
          tournament: next,
          tournamentHistory: [...state.tournamentHistory, prev].slice(-UNDO_LIMIT),
        }));
      };
      const withFormat = (fn: (t: TournamentState, f: NonNullable<ReturnType<typeof getFormat>>) => TournamentState) => {
        const t = get().tournament;
        const f = getFormat(t?.formatId);
        if (!t || !f) return;
        commitTournament(fn(t, f));
      };

      return {
      appMode: 'lobby',
      selectedFormatId: TOURNAMENT_FORMATS[0].id,
      tournament: null,
      tournamentHistory: [],
      overlayView: 'match',

      setAppMode: (mode) => set({ appMode: mode }),
      setSelectedFormatId: (id) => set({ selectedFormatId: id }),
      setOverlayView: (view) => set({ overlayView: view }),

      startTournament: () => {
        const { players, championPools, selectedFormatId } = get();
        const format = getFormat(selectedFormatId);
        if (!format) return 'Unbekanntes Format.';
        if (players.length < format.entrants.min || players.length > format.entrants.max) {
          return format.entrants.min === format.entrants.max
            ? `Dieses Format braucht genau ${format.entrants.min} Spieler (aktuell ${players.length}).`
            : `Dieses Format braucht ${format.entrants.min}–${format.entrants.max} Spieler (aktuell ${players.length}).`;
        }
        const tournament = createTournament(format, players, championPools);
        set({ tournament, tournamentHistory: [], appMode: 'tournament', overlayView: 'match' });
        return null;
      },

      endTournament: () => set({ tournament: null, tournamentHistory: [], appMode: 'lobby' }),

      setTournamentFocus: (phaseId, matchIdx = 0) => {
        const t = get().tournament;
        if (!t) return;
        // Fokus ist reine Ansicht – kein Undo-Snapshot
        set({ tournament: { ...t, focus: { phaseId, matchIdx } } });
      },

      setMatchWinner: (phaseId, matchIdx, teamIdx) =>
        withFormat((t, f) => setTournamentMatchWinner(t, f, get().championPools, phaseId, matchIdx, teamIdx)),

      spinWheel: (phaseId) => withFormat((t, f) => spinTournamentWheel(t, f, get().championPools, phaseId)),

      rerollTournamentPhase: (phaseId) =>
        withFormat((t, f) => rerollTournamentPhase(t, f, get().championPools, phaseId)),

      rerollTournamentChampions: (phaseId, matchIdx, playerId) =>
        withFormat(t => rerollTournamentMatchChampions(t, get().championPools, phaseId, matchIdx, playerId)),

      undoTournament: () => {
        const history = get().tournamentHistory;
        if (history.length === 0) return;
        set({
          tournament: history[history.length - 1],
          tournamentHistory: history.slice(0, -1),
        });
      },

      players: INITIAL_SAMPLE_PLAYERS,
      championPools: DEFAULT_CHAMPION_POOLS,
      matches: [],
      benchPlayers: [],
      activeMatchIndex: 0,
      viewMode: 'stream',

      addPlayer: (name, elo = 'mid', roles = ['top', 'jgl', 'mid', 'adc', 'sup'], bans = []) => {
        const trimmed = name.trim();
        if (!trimmed) return;
        const newPlayer: Player = {
          id: `p-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          name: trimmed,
          elo,
          roles: roles.length > 0 ? roles : ['mid'],
          bans,
        };
        set(state => ({
          players: [...state.players, newPlayer],
        }));
      },

      removePlayer: (id) => {
        set(state => ({
          players: state.players.filter(p => p.id !== id),
        }));
      },

      updatePlayer: (id, updates) => {
        set(state => ({
          players: state.players.map(p => {
            if (p.id !== id) return p;
            // Guarantee at least one role is selected
            if (updates.roles && updates.roles.length === 0) {
              updates.roles = p.roles.length > 0 ? p.roles : ['mid'];
            }
            return { ...p, ...updates };
          }),
        }));
      },

      bulkImportPlayers: (text, defaultElo = 'mid') => {
        const lines = text
          .split(/[\r\n]+/)
          .map(l => l.trim())
          .filter(l => l.length > 0);

        if (lines.length === 0) return;

        const newPlayers: Player[] = lines.map((line, idx) => ({
          id: `p-import-${Date.now()}-${idx}`,
          name: line,
          elo: defaultElo,
          roles: ['top', 'jgl', 'mid', 'adc', 'sup'],
          bans: [],
        }));

        set(state => ({
          players: [...state.players, ...newPlayers],
        }));
      },

      clearPlayers: () => {
        set({ players: [], matches: [], benchPlayers: [] });
      },

      loadSamplePlayers: (count = 10) => {
        if (count === 10) {
          set({ players: INITIAL_SAMPLE_PLAYERS });
        } else {
          // Generate 20 or 30 sample players
          const sampleRoles: Role[][] = [
            ['top', 'jgl'], ['mid', 'top'], ['adc', 'mid'], ['sup'], ['jgl', 'mid'],
            ['top'], ['adc'], ['mid'], ['sup', 'adc'], ['jgl']
          ];
          const sampleElos: EloRating[] = ['low', 'mid', 'high'];
          const generated: Player[] = [];
          for (let i = 1; i <= count; i++) {
            generated.push({
              id: `sample-${i}-${Date.now()}`,
              name: `Summoner ${i}`,
              elo: sampleElos[i % sampleElos.length],
              roles: sampleRoles[i % sampleRoles.length],
              bans: [],
            });
          }
          set({ players: generated });
        }
      },

      updateChampionPools: (pools) => {
        set({ championPools: pools });
      },

      resetChampionPools: () => {
        set({ championPools: DEFAULT_CHAMPION_POOLS });
      },

      generateDraft: () => {
        const { players, championPools } = get();
        if (players.length < 10) return;

        const { matches, benchPlayers } = generateMatchesFromPool(players, championPools);
        set({
          matches,
          benchPlayers,
          activeMatchIndex: 0,
        });
      },

      rerollEntireMatch: (matchIndex) => {
        const { matches, championPools } = get();
        const currentMatch = matches[matchIndex];
        if (!currentMatch) return;

        // Gather the 10 players currently in this match
        const tenPlayers = [
          ...currentMatch.blueTeam.players.map(p => p.player),
          ...currentMatch.redTeam.players.map(p => p.player),
        ];

        const newMatch = balanceTenPlayers(tenPlayers, championPools, matchIndex + 1);

        set(state => {
          const updatedMatches = [...state.matches];
          updatedMatches[matchIndex] = newMatch;
          return { matches: updatedMatches };
        });
      },

      rerollChampionsOnly: (matchIndex) => {
        const { matches, championPools } = get();
        const currentMatch = matches[matchIndex];
        if (!currentMatch) return;

        const updatedMatch = rerollMatchChampions(currentMatch, championPools);

        set(state => {
          const updated = [...state.matches];
          updated[matchIndex] = updatedMatch;
          return { matches: updated };
        });
      },

      rerollPlayerChampion: (matchIndex, teamSide, playerId) => {
        const { matches, championPools } = get();
        const currentMatch = matches[matchIndex];
        if (!currentMatch) return;

        let updatedMatch: Match;
        if (teamSide === 'blue') {
          const updatedTeam = rerollSinglePlayerChampion(currentMatch.blueTeam, playerId, championPools);
          updatedMatch = { ...currentMatch, blueTeam: updatedTeam };
        } else {
          const updatedTeam = rerollSinglePlayerChampion(currentMatch.redTeam, playerId, championPools);
          updatedMatch = { ...currentMatch, redTeam: updatedTeam };
        }

        set(state => {
          const updated = [...state.matches];
          updated[matchIndex] = updatedMatch;
          return { matches: updated };
        });
      },

      setActiveMatchIndex: (index) => {
        set({ activeMatchIndex: index });
      },

      setViewMode: (mode) => {
        set({ viewMode: mode });
      },

      manualSwapPlayers: (matchIndex, source, target) => {
        const { matches } = get();
        const currentMatch = matches[matchIndex];
        if (!currentMatch) return;

        const sourceTeam = source.side === 'blue' ? currentMatch.blueTeam : currentMatch.redTeam;
        const targetTeam = target.side === 'blue' ? currentMatch.blueTeam : currentMatch.redTeam;

        const sourcePlayerIdx = sourceTeam.players.findIndex(p => p.role === source.role);
        const targetPlayerIdx = targetTeam.players.findIndex(p => p.role === target.role);

        if (sourcePlayerIdx === -1 || targetPlayerIdx === -1) return;

        // Clone teams
        const newBluePlayers = [...currentMatch.blueTeam.players];
        const newRedPlayers = [...currentMatch.redTeam.players];

        // Swap players while keeping their slot role
        if (source.side === target.side) {
          const teamArr = source.side === 'blue' ? newBluePlayers : newRedPlayers;
          const p1 = teamArr[sourcePlayerIdx];
          const p2 = teamArr[targetPlayerIdx];
          // Swap players and champions or keep role assigned
          teamArr[sourcePlayerIdx] = { ...p1, player: p2.player, champion: p2.champion };
          teamArr[targetPlayerIdx] = { ...p2, player: p1.player, champion: p1.champion };
        } else {
          const blueIdx = source.side === 'blue' ? sourcePlayerIdx : targetPlayerIdx;
          const redIdx = source.side === 'red' ? sourcePlayerIdx : targetPlayerIdx;

          const blueP = newBluePlayers[blueIdx];
          const redP = newRedPlayers[redIdx];

          newBluePlayers[blueIdx] = { ...blueP, player: redP.player, champion: redP.champion };
          newRedPlayers[redIdx] = { ...redP, player: blueP.player, champion: blueP.champion };
        }

        const newBlueElo = newBluePlayers.reduce((s, p) => s + (p.player.elo === 'high' ? 3 : p.player.elo === 'low' ? 1 : 2), 0);
        const newRedElo = newRedPlayers.reduce((s, p) => s + (p.player.elo === 'high' ? 3 : p.player.elo === 'low' ? 1 : 2), 0);

        const updatedMatch: Match = {
          ...currentMatch,
          blueTeam: { ...currentMatch.blueTeam, players: newBluePlayers, totalElo: newBlueElo },
          redTeam: { ...currentMatch.redTeam, players: newRedPlayers, totalElo: newRedElo },
          eloDifference: Math.abs(newBlueElo - newRedElo),
        };

        set(state => {
          const updated = [...state.matches];
          updated[matchIndex] = updatedMatch;
          return { matches: updated };
        });
      },
    };
    },
    {
      name: 'role-bravery-storage-v2',
      storage: createJSONStorage(() => (isOverlayMode ? memoryStorage : localStorage)),
      partialize: (state) => ({
        players: state.players,
        championPools: state.championPools,
        viewMode: state.viewMode,
        appMode: state.appMode,
        selectedFormatId: state.selectedFormatId,
        tournament: state.tournament,
        tournamentHistory: state.tournamentHistory,
        overlayView: state.overlayView,
        matches: state.matches,
        benchPlayers: state.benchPlayers,
        activeMatchIndex: state.activeMatchIndex,
      }),
    }
  )
);
