import type { PlayerData, MatchInfo } from "../../src/types.js";
import type { RiotSummoner, RiotLeagueEntry } from "./riot.js";
import type { MatchPoints, PlayerStatsSummary } from "./scoring.js";
import type { LPSnapshot } from "./lp-history.js";

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

export class PlayerCache {
  private ttl: number;
  private store = new Map<string, CacheEntry<any>>();

  private summoners = new Map<string, CacheEntry<RiotSummoner>>();
  private matches = new Map<string, CacheEntry<MatchPoints[]>>();
  private players = new Map<string, CacheEntry<PlayerData>>();
  private processedMatches = new Set<string>();
  private lpSnapshots: LPSnapshot[] = [];

  constructor(ttlMs: number = 10 * 60 * 1000) {
    this.ttl = ttlMs;
  }

  isExpired(key: string): boolean {
    const entry = this.store.get(key);
    return !entry || Date.now() - entry.timestamp > this.ttl;
  }

  summonerIsExpired(): boolean {
    if (this.summoners.size === 0) return true;
    const first = this.summoners.values().next().value;
    return !first || Date.now() - first.timestamp > 24 * 60 * 60 * 1000;
  }

  getSummoner(puuid: string): RiotSummoner | null {
    const entry = this.summoners.get(puuid);
    if (!entry || Date.now() - entry.timestamp > 24 * 60 * 60 * 1000) {
      return null;
    }
    return entry.data;
  }

  setSummoner(puuid: string, data: RiotSummoner): void {
    this.summoners.set(puuid, { data, timestamp: Date.now() });
  }

  isMatchProcessed(matchId: string): boolean {
    return this.processedMatches.has(matchId);
  }

  markMatchProcessed(matchId: string): void {
    this.processedMatches.add(matchId);
    if (this.processedMatches.size > 1000) {
      const arr = Array.from(this.processedMatches);
      this.processedMatches = new Set(arr.slice(arr.length - 500));
    }
  }

  getMatches(puuid: string): MatchPoints[] | null {
    const entry = this.matches.get(puuid);
    if (!entry || Date.now() - entry.timestamp > this.ttl) {
      return null;
    }
    return entry.data;
  }

  setMatches(puuid: string, data: MatchPoints[]): void {
    this.matches.set(puuid, { data, timestamp: Date.now() });
  }

  getPlayer(gameName: string): PlayerData | null {
    const entry = this.players.get(gameName.toLowerCase());
    if (!entry || Date.now() - entry.timestamp > this.ttl) {
      return null;
    }
    return entry.data;
  }

  setPlayer(gameName: string, data: PlayerData): void {
    this.players.set(gameName.toLowerCase(), {
      data,
      timestamp: Date.now(),
    });
  }

  getAllPlayers(): PlayerData[] {
    const result: PlayerData[] = [];
    for (const [, entry] of this.players) {
      if (Date.now() - entry.timestamp <= this.ttl) {
        result.push(entry.data);
      }
    }
    return result;
  }

  addLPSnapshot(snapshot: LPSnapshot): void {
    this.lpSnapshots.push(snapshot);
    if (this.lpSnapshots.length > 144) {
      this.lpSnapshots = this.lpSnapshots.slice(-144);
    }
  }

  getLPSnapshots(): LPSnapshot[] {
    return this.lpSnapshots;
  }

  setPlayerMatches(
    gameName: string,
    playerData: PlayerData,
    matchPoints: MatchPoints[],
    stats: PlayerStatsSummary
  ): void {
    const matchInfos: MatchInfo[] = matchPoints.map((m) => ({
      matchId: m.matchId,
      timestamp: 0,
      champion: m.champion,
      championIcon: `https://ddragon.leagueoflegends.com/cdn/14.8.1/img/champion/${m.champion}.png`,
      result: m.result,
      kills: m.kills,
      deaths: m.deaths,
      assists: m.assists,
      kda: m.kda,
      cs: m.cs,
      duration: formatDuration(m.duration),
      lpChange: m.lpChange,
      gameMode: "SoloQ",
    }));

    playerData.matches = matchInfos;
    playerData.stats = {
      gamesPlayed: stats.gamesPlayed,
      wins: stats.wins,
      losses: stats.losses,
      winrate: stats.winrate,
      avgKills: stats.avgKills,
      avgDeaths: stats.avgDeaths,
      avgAssists: stats.avgAssists,
      avgKDA: stats.avgKDA,
      avgCS: stats.avgCS,
      totalLPChange: stats.totalLPChange,
    };
    playerData.points = stats.points;

    this.setPlayer(playerData.gameName, playerData);
    this.setMatches(playerData.puuid, matchPoints);
  }
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
