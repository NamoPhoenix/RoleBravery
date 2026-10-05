export type Role = 'top' | 'jgl' | 'mid' | 'adc' | 'sup';

export type EloRating = 'low' | 'mid' | 'high';

export interface Player {
  id: string;
  name: string;
  elo: EloRating;
  roles: Role[];
  bans: string[]; // Champion names or IDs
}

export interface Champion {
  id: string; // e.g. "Aatrox", "LeeSin", "Ahri"
  name: string; // Display name
  roles: Role[];
}

export interface ChampionPools {
  top: string[];
  jgl: string[];
  mid: string[];
  adc: string[];
  sup: string[];
}

export interface AssignedPlayer {
  player: Player;
  role: Role;
  champion: {
    id: string;
    name: string;
    image: string;
    loadingImage: string;
    splashImage: string;
  };
}

export interface Team {
  name: string;
  side: 'blue' | 'red';
  players: AssignedPlayer[];
  totalElo: number;
}

export interface Match {
  id: string;
  index: number;
  blueTeam: Team;
  redTeam: Team;
  eloDifference: number;
  timestamp: number;
}

export type ViewMode = 'stream' | 'panel' | 'overlay';
