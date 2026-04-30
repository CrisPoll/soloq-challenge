import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import type { PlayerData, MatchInfo } from "../../src/types.js";
import type { RiotSummoner, RiotLeagueEntry } from "./riot.js";
import type { MatchPoints, PlayerStatsSummary } from "./scoring.js";
import type { LPSnapshot } from "./lp-history.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SNAPSHOT_FILE = path.resolve(__dirname, "../data/lp-snapshots.json");
const MATCHES_FILE = path.resolve(__dirname, "../data/matches.json");
const PROCESSED_FILE = path.resolve(__dirname, "../data/processed-matches.json");

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
    if (this.processedMatches.size > 10000) {
      const arr = Array.from(this.processedMatches);
      this.processedMatches = new Set(arr.slice(arr.length - 5000));
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

  async loadLPSnapshots(): Promise<void> {
    try {
      const raw = await fs.readFile(SNAPSHOT_FILE, "utf-8");
      const data = JSON.parse(raw);
      if (Array.isArray(data)) {
        this.lpSnapshots = data;
        console.log(`[LP] Loaded ${data.length} snapshots from disk`);
      }
    } catch (err: any) {
      if (err.code === "ENOENT") {
        console.log("[LP] No snapshot file found, starting fresh");
        await fs.mkdir(path.dirname(SNAPSHOT_FILE), { recursive: true });
        await fs.writeFile(SNAPSHOT_FILE, "[]", "utf-8");
      } else {
        console.error("[LP] Failed to load snapshots:", err);
      }
    }
  }

  addLPSnapshot(snapshot: LPSnapshot): void {
    this.lpSnapshots.push(snapshot);
    if (this.lpSnapshots.length > 4320) {
      this.lpSnapshots = this.lpSnapshots.slice(-4320);
    }
    this._saveToDisk();
  }

  private async _saveToDisk(): Promise<void> {
    try {
      const toSave = this.lpSnapshots.length > 4320
        ? this.lpSnapshots.slice(-4320)
        : this.lpSnapshots;
      await fs.writeFile(SNAPSHOT_FILE, JSON.stringify(toSave, null, 2), "utf-8");
      console.log(`[LP] Saved ${toSave.length} snapshots to disk`);
    } catch (err) {
      console.error("[LP] Failed to save snapshots:", err);
    }
  }

  getLPSnapshots(): LPSnapshot[] {
    return this.lpSnapshots;
  }

  getLastPlayerNumericLP(gameName: string, fallback: number): number {
    if (this.lpSnapshots.length === 0) return fallback;
    const lastSnapshot = this.lpSnapshots[this.lpSnapshots.length - 1];
    const player = lastSnapshot.players.find(
      (p) => p.gameName.toLowerCase() === gameName.toLowerCase()
    );
    return player ? player.numericLP : fallback;
  }

  setPlayerMatches(
    gameName: string,
    playerData: PlayerData,
    matchPoints: MatchPoints[],
    stats: PlayerStatsSummary
  ): void {
    const matchInfos: MatchInfo[] = matchPoints.map((m) => ({
      matchId: m.matchId,
      timestamp: m.timestamp,
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

  async loadMatchCache(): Promise<void> {
    try {
      const raw = await fs.readFile(PROCESSED_FILE, "utf-8");
      const ids: string[] = JSON.parse(raw);
      if (Array.isArray(ids)) {
        this.processedMatches = new Set(ids);
        console.log(`[MATCH] Loaded ${ids.length} processed match IDs from disk`);
      }
    } catch (err: any) {
      if (err.code !== "ENOENT") console.error("[MATCH] Failed to load processed IDs:", err.message);
    }
    try {
      const raw = await fs.readFile(MATCHES_FILE, "utf-8");
      const data: Record<string, MatchPoints[]> = JSON.parse(raw);
      let count = 0;
      for (const [puuid, matches] of Object.entries(data)) {
        if (Array.isArray(matches) && matches.length > 0) {
          this.matches.set(puuid, { data: matches, timestamp: Date.now() });
          count += matches.length;
        }
      }
      console.log(`[MATCH] Loaded ${count} matches for ${this.matches.size} players from disk`);
    } catch (err: any) {
      if (err.code !== "ENOENT") console.error("[MATCH] Failed to load matches:", err.message);
    }
  }

  async persistMatchCache(): Promise<void> {
    const matchData: Record<string, MatchPoints[]> = {};
    for (const [puuid, entry] of this.matches) {
      if (entry.data.length > 0) {
        matchData[puuid] = entry.data;
      }
    }
    try {
      await fs.writeFile(PROCESSED_FILE, JSON.stringify(Array.from(this.processedMatches)), "utf-8");
      await fs.writeFile(MATCHES_FILE, JSON.stringify(matchData), "utf-8");
      console.log(`[MATCH] Persisted ${this.processedMatches.size} processed IDs + ${Object.values(matchData).reduce((s, m) => s + m.length, 0)} matches to disk`);
    } catch (err) {
      console.error("[MATCH] Failed to persist match cache:", err);
    }
  }
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
