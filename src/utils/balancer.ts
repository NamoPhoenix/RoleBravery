import { Player, Role, Team, Match, ChampionPools, AssignedPlayer, EloRating } from '../types';
import { getChampionImages } from '../data/defaultChampions';
import { ROLE_ORDER } from '../components/RoleIcon';

export const ELO_SCORES: Record<EloRating, number> = {
  low: 1,
  mid: 2,
  high: 3,
};

export const getPlayerEloScore = (elo: EloRating): number => {
  return ELO_SCORES[elo] || 2;
};

/**
 * Solve bipartite matching to assign 5 players to 5 distinct roles [top, jgl, mid, adc, sup]
 * using the players' allowed roles.
 * Returns null if no 100% valid assignment exists.
 */
export function assignRolesToTeam(players: Player[]): Map<string, Role> | null {
  const roles: Role[] = [...ROLE_ORDER];
  const assignment = new Map<string, Role>();

  function backtrack(roleIndex: number, usedPlayerIds: Set<string>): boolean {
    if (roleIndex === roles.length) {
      return true;
    }

    const currentRole = roles[roleIndex];
    // Find players who can play currentRole and haven't been assigned yet
    // Shuffle candidates for fair randomness when multiple players can play a role
    const candidates = players
      .filter(p => !usedPlayerIds.has(p.id) && p.roles.includes(currentRole))
      .sort(() => Math.random() - 0.5);

    for (const player of candidates) {
      usedPlayerIds.add(player.id);
      assignment.set(player.id, currentRole);

      if (backtrack(roleIndex + 1, usedPlayerIds)) {
        return true;
      }

      usedPlayerIds.delete(player.id);
      assignment.delete(player.id);
    }

    return false;
  }

  // Shuffle roles order slightly or players for diversity
  const success = backtrack(0, new Set());
  if (success) {
    return assignment;
  }

  // Fallback: If no perfect assignment exists, greedily assign best preferences and autofill the rest
  return fallbackRoleAssignment(players);
}

function fallbackRoleAssignment(players: Player[]): Map<string, Role> {
  const roles: Role[] = [...ROLE_ORDER];
  const assignment = new Map<string, Role>();
  const unassignedPlayers = [...players];
  const unassignedRoles = new Set<Role>(roles);

  // First pass: assign unique preferences
  for (const role of roles) {
    const candidates = unassignedPlayers.filter(p => p.roles.includes(role));
    if (candidates.length === 1) {
      const p = candidates[0];
      assignment.set(p.id, role);
      unassignedRoles.delete(role);
      const idx = unassignedPlayers.findIndex(x => x.id === p.id);
      if (idx !== -1) unassignedPlayers.splice(idx, 1);
    }
  }

  // Second pass: fill remaining roles with players who prefer them if possible
  for (const role of Array.from(unassignedRoles)) {
    const candidateIdx = unassignedPlayers.findIndex(p => p.roles.includes(role));
    if (candidateIdx !== -1) {
      const p = unassignedPlayers.splice(candidateIdx, 1)[0];
      assignment.set(p.id, role);
      unassignedRoles.delete(role);
    }
  }

  // Third pass: autofill any leftover players to remaining roles
  for (const role of Array.from(unassignedRoles)) {
    if (unassignedPlayers.length > 0) {
      const p = unassignedPlayers.pop()!;
      assignment.set(p.id, role);
    }
  }

  return assignment;
}

/**
 * Generates all combinations of n choose k
 */
function getCombinations<T>(array: T[], k: number): T[][] {
  const result: T[][] = [];

  function combine(start: number, combo: T[]) {
    if (combo.length === k) {
      result.push([...combo]);
      return;
    }
    for (let i = start; i < array.length; i++) {
      combo.push(array[i]);
      combine(i + 1, combo);
      combo.pop();
    }
  }

  combine(0, []);
  return result;
}

/**
 * Assign a bravery champion to a player for their assigned role
 * respecting their bans and team duplicate constraints.
 */
export function assignBraveryChampion(
  role: Role,
  playerBans: string[],
  usedChampionNamesInTeam: Set<string>,
  pools: ChampionPools
): { id: string; name: string; image: string; loadingImage: string; splashImage: string } {
  const rolePool = pools[role] || [];
  const bannedSet = new Set(playerBans.map(b => b.toLowerCase().trim()));

  // Available champions: in role pool, not banned by this player, not already picked by teammates
  const validChamps = rolePool.filter(
    c => !bannedSet.has(c.toLowerCase().trim()) && !usedChampionNamesInTeam.has(c)
  );

  let selectedChampName: string;

  if (validChamps.length > 0) {
    const randomIndex = Math.floor(Math.random() * validChamps.length);
    selectedChampName = validChamps[randomIndex];
  } else {
    // Soft fallback 1: Relax bans if the player banned all champions in their role
    const nonTeamChamps = rolePool.filter(c => !usedChampionNamesInTeam.has(c));
    if (nonTeamChamps.length > 0) {
      selectedChampName = nonTeamChamps[Math.floor(Math.random() * nonTeamChamps.length)];
    } else if (rolePool.length > 0) {
      // Soft fallback 2: Any champion in the role pool
      selectedChampName = rolePool[Math.floor(Math.random() * rolePool.length)];
    } else {
      // Fallback 3: generic
      selectedChampName = "Aatrox";
    }
  }

  usedChampionNamesInTeam.add(selectedChampName);
  const imgs = getChampionImages(selectedChampName);
  return {
    id: imgs.id,
    name: selectedChampName,
    image: imgs.icon,
    loadingImage: imgs.loading,
    splashImage: imgs.splash
  };
}

/**
 * Balances a single group of 10 players into Blue and Red sides
 * with minimal Elo difference and valid role assignments.
 */
export function balanceTenPlayers(
  tenPlayers: Player[],
  pools: ChampionPools,
  matchIndex: number
): Match {
  if (tenPlayers.length < 10) {
    throw new Error('Für ein Match werden genau 10 Spieler benötigt.');
  }

  // 10 choose 5 = 252 combinations
  const allCombos = getCombinations(tenPlayers, 5);

  interface ValidPartition {
    teamA: Player[];
    teamB: Player[];
    teamARoles: Map<string, Role>;
    teamBRoles: Map<string, Role>;
    eloDiff: number;
    perfectRoleCoverage: boolean;
  }

  const validPartitions: ValidPartition[] = [];

  for (const teamA of allCombos) {
    const teamAIds = new Set(teamA.map(p => p.id));
    const teamB = tenPlayers.filter(p => !teamAIds.has(p.id));

    const totalEloA = teamA.reduce((sum, p) => sum + getPlayerEloScore(p.elo), 0);
    const totalEloB = teamB.reduce((sum, p) => sum + getPlayerEloScore(p.elo), 0);
    const eloDiff = Math.abs(totalEloA - totalEloB);

    const teamARoles = assignRolesToTeam(teamA);
    const teamBRoles = assignRolesToTeam(teamB);

    if (teamARoles && teamBRoles) {
      // Check if both teams satisfied preferences perfectly
      const perfectA = teamA.every(p => p.roles.includes(teamARoles.get(p.id)!));
      const perfectB = teamB.every(p => p.roles.includes(teamBRoles.get(p.id)!));

      validPartitions.push({
        teamA,
        teamB,
        teamARoles,
        teamBRoles,
        eloDiff,
        perfectRoleCoverage: perfectA && perfectB
      });
    }
  }

  // Filter for perfect role coverage first if available
  const perfectPartitions = validPartitions.filter(p => p.perfectRoleCoverage);
  const candidates = perfectPartitions.length > 0 ? perfectPartitions : validPartitions;

  if (candidates.length === 0) {
    // Extreme edge case: split first 5 and last 5
    const teamA = tenPlayers.slice(0, 5);
    const teamB = tenPlayers.slice(5, 10);
    const teamARoles = fallbackRoleAssignment(teamA);
    const teamBRoles = fallbackRoleAssignment(teamB);
    const eloDiff = Math.abs(
      teamA.reduce((s, p) => s + getPlayerEloScore(p.elo), 0) -
      teamB.reduce((s, p) => s + getPlayerEloScore(p.elo), 0)
    );
    candidates.push({ teamA, teamB, teamARoles, teamBRoles, eloDiff, perfectRoleCoverage: false });
  }

  // Find minimum Elo difference
  const minEloDiff = Math.min(...candidates.map(c => c.eloDiff));
  const optimalPartitions = candidates.filter(c => c.eloDiff === minEloDiff);

  // Pick a random optimal partition for variety
  const chosen = optimalPartitions[Math.floor(Math.random() * optimalPartitions.length)];

  // Randomize Blue vs Red sides for fair coin-flip side selection
  const coinFlip = Math.random() < 0.5;
  const bluePlayersRaw = coinFlip ? chosen.teamA : chosen.teamB;
  const blueRoles = coinFlip ? chosen.teamARoles : chosen.teamBRoles;
  const redPlayersRaw = coinFlip ? chosen.teamB : chosen.teamA;
  const redRoles = coinFlip ? chosen.teamBRoles : chosen.teamARoles;

  // Build Blue Team with champions
  const blueUsedChamps = new Set<string>();
  const blueAssigned: AssignedPlayer[] = ROLE_ORDER.map(role => {
    const player = bluePlayersRaw.find(p => blueRoles.get(p.id) === role)!;
    const champ = assignBraveryChampion(role, player.bans, blueUsedChamps, pools);
    return {
      player,
      role,
      champion: champ
    };
  });

  // Build Red Team with champions
  const redUsedChamps = new Set<string>();
  const redAssigned: AssignedPlayer[] = ROLE_ORDER.map(role => {
    const player = redPlayersRaw.find(p => redRoles.get(p.id) === role)!;
    const champ = assignBraveryChampion(role, player.bans, redUsedChamps, pools);
    return {
      player,
      role,
      champion: champ
    };
  });

  const blueTotalElo = blueAssigned.reduce((s, p) => s + getPlayerEloScore(p.player.elo), 0);
  const redTotalElo = redAssigned.reduce((s, p) => s + getPlayerEloScore(p.player.elo), 0);

  const blueTeam: Team = {
    name: 'Blue Side',
    side: 'blue',
    players: blueAssigned,
    totalElo: blueTotalElo
  };

  const redTeam: Team = {
    name: 'Red Side',
    side: 'red',
    players: redAssigned,
    totalElo: redTotalElo
  };

  return {
    id: `match-${matchIndex}-${Date.now()}`,
    index: matchIndex,
    blueTeam,
    redTeam,
    eloDifference: Math.abs(blueTotalElo - redTotalElo),
    timestamp: Date.now()
  };
}

/**
 * Creates matches for any array of players in groups of 10.
 * Leftover players (if any) are returned in bench.
 */
export function generateMatchesFromPool(
  players: Player[],
  pools: ChampionPools
): { matches: Match[]; benchPlayers: Player[] } {
  // Shuffle player order so multiple 10-player blocks get distributed dynamically
  const shuffled = [...players].sort(() => Math.random() - 0.5);

  const matchCount = Math.floor(shuffled.length / 10);
  const matches: Match[] = [];

  for (let i = 0; i < matchCount; i++) {
    const block = shuffled.slice(i * 10, (i + 1) * 10);
    const match = balanceTenPlayers(block, pools, i + 1);
    matches.push(match);
  }

  const benchPlayers = shuffled.slice(matchCount * 10);

  return {
    matches,
    benchPlayers
  };
}

/**
 * Rerolls champions for an existing match without changing teams or roles
 */
export function rerollMatchChampions(match: Match, pools: ChampionPools): Match {
  const blueUsedChamps = new Set<string>();
  const newBluePlayers = match.blueTeam.players.map(ap => ({
    ...ap,
    champion: assignBraveryChampion(ap.role, ap.player.bans, blueUsedChamps, pools)
  }));

  const redUsedChamps = new Set<string>();
  const newRedPlayers = match.redTeam.players.map(ap => ({
    ...ap,
    champion: assignBraveryChampion(ap.role, ap.player.bans, redUsedChamps, pools)
  }));

  return {
    ...match,
    blueTeam: {
      ...match.blueTeam,
      players: newBluePlayers
    },
    redTeam: {
      ...match.redTeam,
      players: newRedPlayers
    },
    timestamp: Date.now()
  };
}

/**
 * Rerolls champion for a single player in a team
 */
export function rerollSinglePlayerChampion(
  team: Team,
  playerId: string,
  pools: ChampionPools
): Team {
  // Teammates' existing champions
  const otherChamps = new Set<string>(
    team.players.filter(p => p.player.id !== playerId).map(p => p.champion.name)
  );

  const updatedPlayers = team.players.map(ap => {
    if (ap.player.id !== playerId) return ap;
    const newChamp = assignBraveryChampion(ap.role, ap.player.bans, otherChamps, pools);
    return {
      ...ap,
      champion: newChamp
    };
  });

  return {
    ...team,
    players: updatedPlayers
  };
}
