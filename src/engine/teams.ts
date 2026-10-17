import { AssignedPlayer, ChampionPools, Player, Role } from '../types';
import { ChampionMode } from '../formats/types';
import { ROLE_ORDER } from '../components/RoleIcon';
import { ALL_CHAMPIONS_SORTED, getChampionImages } from '../data/defaultChampions';
import {
  assignBraveryChampion,
  assignRolesToTeam,
  balanceTenPlayers,
  getPlayerEloScore,
} from '../utils/balancer';

export type ChampionPick = AssignedPlayer['champion'];

export interface TSlot {
  player: Player;
  role?: Role;
  champion?: ChampionPick;
}

export interface TTeam {
  name: string;
  slots: TSlot[];
  totalElo: number;
}

export const shuffle = <T,>(arr: T[]): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const teamElo = (players: Player[]) => players.reduce((s, p) => s + getPlayerEloScore(p.elo), 0);

const hasPerfectRoles = (team: Player[]): boolean => {
  const assignment = assignRolesToTeam(team);
  return !!assignment && team.every(p => p.roles.includes(assignment.get(p.id)!));
};

/**
 * Teilt Spieler Elo-balanciert in `teamCount` Teams auf.
 * 2×5 nutzt den exakten Balancer (alle 252 Kombinationen), sonst
 * Hill-Climbing mit Zufalls-Neustarts. Bei 5er-Teams hat eine perfekte
 * Rollenabdeckung Vorrang vor der Elo-Differenz (wie im Balancer).
 */
export function balanceIntoTeams(players: Player[], teamCount: number, teamSize: number): Player[][] {
  const withRoles = teamSize === ROLE_ORDER.length;
  const roleCache = new Map<string, boolean>();
  const roleOk = (team: Player[]) => {
    if (!withRoles) return true;
    const key = team.map(p => p.id).sort().join('|');
    if (!roleCache.has(key)) roleCache.set(key, hasPerfectRoles(team));
    return roleCache.get(key)!;
  };
  const cost = (teams: Player[][]) => {
    const elos = teams.map(teamElo);
    const spread = Math.max(...elos) - Math.min(...elos);
    const badRoles = teams.filter(t => !roleOk(t)).length;
    return badRoles * 1000 + spread;
  };

  let best: Player[][] = [];
  let bestCost = Infinity;
  for (let restart = 0; restart < 40; restart++) {
    const s = shuffle(players);
    const teams = Array.from({ length: teamCount }, (_, i) => s.slice(i * teamSize, (i + 1) * teamSize));
    let current = cost(teams);
    let improved = true;
    while (improved) {
      improved = false;
      for (let a = 0; a < teamCount && !improved; a++) {
        for (let b = a + 1; b < teamCount && !improved; b++) {
          for (let i = 0; i < teamSize && !improved; i++) {
            for (let j = 0; j < teamSize && !improved; j++) {
              [teams[a][i], teams[b][j]] = [teams[b][j], teams[a][i]];
              const c = cost(teams);
              if (c < current) {
                current = c;
                improved = true;
              } else {
                [teams[a][i], teams[b][j]] = [teams[b][j], teams[a][i]];
              }
            }
          }
        }
      }
    }
    if (current < bestCost) {
      bestCost = current;
      best = teams.map(t => [...t]);
    }
    if (bestCost === 0) break;
  }
  return best;
}

/** Bravery-Pick ohne feste Rolle (z. B. für ein 2v2-Bravery-Format). */
function randomChampion(bans: string[], used: Set<string>): ChampionPick {
  const banned = new Set(bans.map(b => b.toLowerCase().trim()));
  const valid = ALL_CHAMPIONS_SORTED.filter(c => !banned.has(c.toLowerCase()) && !used.has(c));
  const pool = valid.length > 0 ? valid : ALL_CHAMPIONS_SORTED;
  const name = pool[Math.floor(Math.random() * pool.length)];
  used.add(name);
  const imgs = getChampionImages(name);
  return { id: imgs.id, name, image: imgs.icon, loadingImage: imgs.loading, splashImage: imgs.splash };
}

/** Baut die Slots eines Teams: Rollen (bei 5er-Teams) und ggf. Bravery-Champions. */
export function buildTeam(name: string, players: Player[], mode: ChampionMode, pools: ChampionPools): TTeam {
  const withRoles = players.length === ROLE_ORDER.length;
  const used = new Set<string>();
  let slots: TSlot[];
  if (withRoles) {
    const roles = assignRolesToTeam(players)!;
    slots = ROLE_ORDER.map(role => {
      const player = players.find(p => roles.get(p.id) === role)!;
      return {
        player,
        role,
        champion: mode === 'bravery' ? assignBraveryChampion(role, player.bans, used, pools) : undefined,
      };
    });
  } else {
    slots = players.map(player => ({
      player,
      champion: mode === 'bravery' ? randomChampion(player.bans, used) : undefined,
    }));
  }
  return { name, slots, totalElo: teamElo(players) };
}

/** Würfelt die Champions eines Teams neu (Teams und Rollen bleiben). */
export function rerollTeamChampions(team: TTeam, pools: ChampionPools, onlyPlayerId?: string): TTeam {
  const used = new Set(
    team.slots.filter(s => onlyPlayerId && s.player.id !== onlyPlayerId && s.champion).map(s => s.champion!.name)
  );
  return {
    ...team,
    slots: team.slots.map(s => {
      if (onlyPlayerId && s.player.id !== onlyPlayerId) return s;
      if (!s.champion) return s;
      const champion = s.role
        ? assignBraveryChampion(s.role, s.player.bans, used, pools)
        : randomChampion(s.player.bans, used);
      return { ...s, champion };
    }),
  };
}

/**
 * Teilt Spieler in Teams auf und lost die Paarungen.
 * Gibt Teams paarweise zurück: [[t1, t2], [t3, t4], …].
 */
export function drawTeamPairs(
  players: Player[],
  teamSize: number,
  grouping: 'eloBalanced' | 'random',
  mode: ChampionMode,
  pools: ChampionPools,
  teamNames: string[] = []
): TTeam[][] {
  const teamCount = Math.floor(players.length / teamSize);
  const nameFor = (idx: number, members: Player[]) =>
    teamNames[idx] ?? (teamSize === 1 ? members[0].name : `Team ${String.fromCharCode(65 + idx)}`);

  let groups: Player[][];
  if (grouping === 'eloBalanced' && teamCount === 2 && teamSize === 5 && mode === 'bravery') {
    // Exakter Bestandsbalancer inkl. Rollen + Bravery
    const m = balanceTenPlayers(players.slice(0, 10), pools, 1);
    const toTeam = (idx: number, ap: AssignedPlayer[]): TTeam => ({
      name: nameFor(idx, ap.map(a => a.player)),
      slots: ap.map(a => ({ player: a.player, role: a.role, champion: a.champion })),
      totalElo: teamElo(ap.map(a => a.player)),
    });
    return [[toTeam(0, m.blueTeam.players), toTeam(1, m.redTeam.players)]];
  } else if (grouping === 'eloBalanced') {
    groups = balanceIntoTeams(players, teamCount, teamSize);
  } else {
    const s = shuffle(players);
    groups = Array.from({ length: teamCount }, (_, i) => s.slice(i * teamSize, (i + 1) * teamSize));
  }

  // Paarungen losen
  const order = shuffle(groups);
  const pairs: TTeam[][] = [];
  for (let i = 0; i + 1 < order.length; i += 2) {
    pairs.push([
      buildTeam(nameFor(i, order[i]), order[i], mode, pools),
      buildTeam(nameFor(i + 1, order[i + 1]), order[i + 1], mode, pools),
    ]);
  }
  return pairs;
}
