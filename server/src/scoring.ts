import type { RiotMatch, RiotParticipant } from "./riot.js";

const RANK_NUMERIC_MAP: Record<string, Record<string, number>> = {
  CHALLENGER:  { I: 3200, II: 3200, III: 3200, IV: 3200 },
  GRANDMASTER:{ I: 2800, II: 2800, III: 2800, IV: 2800 },
  MASTER:     { I: 2400, II: 2400, III: 2400, IV: 2400 },
  DIAMOND:    { I: 2100, II: 1900, III: 1700, IV: 1600 },
  EMERALD:    { I: 1500, II: 1400, III: 1300, IV: 1200 },
  PLATINUM:   { I: 1100, II: 1000, III:  900, IV:  800 },
  GOLD:       { I:  700, II:  600, III:  500, IV:  400 },
  SILVER:     { I:  350, II:  300, III:  250, IV:  200 },
  BRONZE:     { I:  150, II:  100, III:   50, IV:    0 },
  IRON:       { I:    0, II:    0, III:    0, IV:    0 },
};

export function rankToNumericLP(tier: string, rank: string, lp: number): number {
  const t = tier.toUpperCase();
  const tierMap = RANK_NUMERIC_MAP[t];
  if (!tierMap) return lp;
  const division = rank || "IV";
  const base = tierMap[division] ?? tierMap["IV"] ?? 0;
  return base + lp;
}

export interface MatchPoints {
  matchId: string;
  timestamp: number;
  result: "Win" | "Loss";
  points: number;
  lpChange: number;
  kills: number;
  deaths: number;
  assists: number;
  kda: number;
  cs: number;
  champion: string;
  duration: number;
  isSoloQ: boolean;
}

export function calculateMatchPoints(
  match: RiotMatch,
  puuid: string,
  realLpChange: number | null
): MatchPoints {
  const participant = match.info.participants.find((p) => p.puuid === puuid);
  if (!participant) {
    throw new Error("Player not found in match");
  }

  const kills = participant.kills;
  const deaths = participant.deaths;
  const assists = participant.assists;
  const kda = deaths === 0 ? kills + assists : (kills + assists) / deaths;
  const cs =
    participant.totalMinionsKilled + (participant.neutralMinionsKilled || 0);

  const win = participant.win;
  let points = win ? 10 : -5;

  if (kda >= 5) {
    points += 5;
  } else if (kda >= 3) {
    points += 3;
  }

  const isSoloQ = match.info.queueId === 420;

  let lpChange = 0;
  if (isSoloQ && realLpChange !== null) {
    lpChange = realLpChange;
  } else if (isSoloQ) {
    const baseLp = win ? 20 : -18;
    const performanceBonus = kda >= 5 ? 3 : kda >= 3 ? 2 : 0;
    lpChange = Math.round(baseLp + (win ? performanceBonus : -performanceBonus));
  }

  return {
    matchId: match.metadata.matchId,
    timestamp: match.info.gameEndTimestamp,
    result: win ? "Win" : "Loss",
    points,
    lpChange,
    kills,
    deaths,
    assists,
    kda,
    cs,
    champion: participant.championName,
    duration: match.info.gameDuration,
    isSoloQ,
  };
}

export function calculateTotalPoints(
  matches: MatchPoints[]
): { points: number; stats: PlayerStatsSummary } {
  let points = 0;
  let totalKills = 0;
  let totalDeaths = 0;
  let totalAssists = 0;
  let totalCS = 0;
  let wins = 0;
  let losses = 0;
  let totalLP = 0;

  for (const m of matches) {
    points += m.points;
    totalKills += m.kills;
    totalDeaths += m.deaths;
    totalAssists += m.assists;
    totalCS += m.cs;
    totalLP += m.lpChange;
    if (m.result === "Win") wins++;
    else losses++;
  }

  const games = matches.length;
  return {
    points: Math.max(0, points),
    stats: {
      gamesPlayed: games,
      wins,
      losses,
      winrate: games > 0 ? wins / games : 0,
      avgKills: games > 0 ? totalKills / games : 0,
      avgDeaths: games > 0 ? totalDeaths / games : 0,
      avgAssists: games > 0 ? totalAssists / games : 0,
      avgKDA:
        totalDeaths === 0
          ? totalKills + totalAssists
          : (totalKills + totalAssists) / totalDeaths,
      avgCS: games > 0 ? totalCS / games : 0,
      totalLPChange: totalLP,
      points: Math.max(0, points),
    },
  };
}

export interface PlayerStatsSummary {
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
  points: number;
}
