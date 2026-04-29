export interface PlayerData {
  puuid: string;
  gameName: string;
  tagLine: string;
  summonerId?: string;
  profileIconId: number;
  summonerLevel: number;
  rank: RankInfo;
  stats: PlayerStats;
  points: number;
  matches: MatchInfo[];
}

export interface RankInfo {
  tier: string;
  rank: string;
  leaguePoints: number;
  wins: number;
  losses: number;
  winrate: number;
}

export interface PlayerStats {
  gamesPlayed: number;
  wins: number;
  losses: number;
  winrate: number;
  avgKills: number;
  avgDeaths: number;
  avgAssists: number;
  avgKDA: number;
  avgCS: number;
  totalLPChange: number;
}

export interface MatchInfo {
  matchId: string;
  timestamp: number;
  champion: string;
  championIcon: string;
  result: "Win" | "Loss";
  kills: number;
  deaths: number;
  assists: number;
  kda: number;
  cs: number;
  duration: string;
  lpChange: number;
  gameMode: string;
}

export interface LPSnapshot {
  timestamp: number;
  players: {
    gameName: string;
    tier: string;
    rank: string;
    lp: number;
    numericLP: number;
  }[];
}

export interface LeaderboardEntry {
  rank: number;
  gameName: string;
  tagLine: string;
  profileIconId: number;
  currentRank: RankInfo;
  stats: PlayerStats;
  points: number;
}

export interface GlobalStats {
  avgWinrate: number;
  totalGames: number;
  playerOfDay: {
    gameName: string;
    lpGained: number;
  } | null;
  topChampions: {
    champion: string;
    championIcon: string;
    wins: number;
    losses: number;
    winrate: number;
    playedBy: string;
  }[];
}
