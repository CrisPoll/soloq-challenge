import type { RiotMatch, RiotParticipant } from "./riot.js";

export interface MatchPoints {
  matchId: string;
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
}

export function calculateMatchPoints(
  match: RiotMatch,
  puuid: string,
  prevLp: number | null
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

  const isSoloQ =
    match.info.queueId === 420 ||
    match.info.queueId === 440 ||
    match.info.queueId === 470;

  let lpChange = 0;
  if (!isSoloQ && prevLp !== null) {
    lpChange = 0;
  } else {
    const baseLp = win ? 20 : -18;
    const performanceBonus = kda >= 5 ? 3 : kda >= 3 ? 2 : 0;
    lpChange = Math.round(baseLp + (win ? performanceBonus : -performanceBonus));
  }

  return {
    matchId: match.metadata.matchId,
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
