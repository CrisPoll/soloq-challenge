import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { createRiotAPI, type RiotLeagueEntry } from "./riot.js";
import { calculateMatchPoints, calculateTotalPoints } from "./scoring.js";
import { PlayerCache } from "./cache.js";
import type { PlayerData, RankInfo, LeaderboardEntry } from "../../src/types.js";
import type { LPSnapshot } from "./lp-history.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const RIOT_API_KEY = process.env.RIOT_API_KEY || "";
const PORT = parseInt(process.env.PORT || "3001", 10);
const PLAYER_LIST = process.env.PLAYERS || "";
const UPDATE_INTERVAL = 10 * 60 * 1000;

const api = createRiotAPI(RIOT_API_KEY);
const cache = new PlayerCache(UPDATE_INTERVAL);

function parsePlayers(): { gameName: string; tagLine: string }[] {
  return PLAYER_LIST.split(",")
    .map((p) => p.trim())
    .filter((p) => p.includes("#"))
    .map((p) => {
      const [gameName, tagLine] = p.split("#");
      return { gameName: gameName.trim(), tagLine: tagLine.trim() };
    });
}

function getRankIconUrl(tier: string): string {
  const t = tier.toLowerCase();
  return `https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-shared-components/global/default/${t}.png`;
}

function parseRank(entries: RiotLeagueEntry[]): RankInfo {
  const soloQ = entries.find((e) => e.queueType === "RANKED_SOLO_5x5");
  if (!soloQ) {
    return {
      tier: "UNRANKED",
      rank: "",
      leaguePoints: 0,
      wins: 0,
      losses: 0,
      winrate: 0,
    };
  }
  const total = soloQ.wins + soloQ.losses;
  return {
    tier: soloQ.tier,
    rank: soloQ.rank,
    leaguePoints: soloQ.leaguePoints,
    wins: soloQ.wins,
    losses: soloQ.losses,
    winrate: total > 0 ? soloQ.wins / total : 0,
  };
}

async function fetchPlayerData(
  gameName: string,
  tagLine: string
): Promise<PlayerData | null> {
  try {
    console.log(`[RIOT] Fetching ${gameName}#${tagLine}...`);

    const account = await api.getAccount(gameName, tagLine);
    const puuid = account.puuid;

    let summoner = cache.getSummoner(puuid);
    if (!summoner) {
      summoner = await api.getSummoner(puuid);
      cache.setSummoner(puuid, summoner);
    }

    const leagueEntries = await api.getLeagueEntries(puuid);
    const rank = parseRank(leagueEntries);

    const existing = cache.getPlayer(gameName);
    const existingMatches = cache.getMatches(puuid) || [];

    const matchIds = await api.getMatchIds(puuid, 10);
    const newMatchIds = matchIds.filter(
      (id) => !cache.isMatchProcessed(id)
    );

    const newMatches: Awaited<ReturnType<typeof calculateMatchPoints>>[] = [];
    for (const matchId of newMatchIds) {
      try {
        const match = await api.getMatch(matchId);
        const points = calculateMatchPoints(match, puuid, null);
        newMatches.push(points);
        cache.markMatchProcessed(matchId);
        await new Promise((r) => setTimeout(r, 100));
      } catch (err) {
        console.error(`[RIOT] Error fetching match ${matchId}:`, err);
      }
    }

    const allMatches = [...existingMatches, ...newMatches];
    const sortedMatches = allMatches.sort(
      (a, b) => existingMatches.indexOf(a) - existingMatches.indexOf(b)
    );
    const recentMatches = sortedMatches.slice(0, 20);

    const { points, stats } = calculateTotalPoints(recentMatches);

    const playerData: PlayerData = {
      puuid: account.puuid,
      gameName: account.gameName,
      tagLine: account.tagLine,
      summonerId: summoner.id,
      profileIconId: summoner.profileIconId,
      summonerLevel: summoner.summonerLevel,
      rank,
      points,
      stats,
      matches: [],
    };

    cache.setPlayerMatches(gameName, playerData, recentMatches, {
      ...stats,
      points,
    });

    console.log(
      `[RIOT] ${gameName}#${tagLine} - ${rank.tier} ${rank.rank} ${rank.leaguePoints}LP - ${points}pts (${newMatches.length} new matches)`
    );

    return playerData;
  } catch (err) {
    console.error(`[RIOT] Failed to fetch ${gameName}#${tagLine}:`, err);
    const existing = cache.getPlayer(gameName);
    if (existing) {
      console.log(`[RIOT] Returning cached data for ${gameName}#${tagLine}`);
    }
    return existing || null;
  }
}

async function refreshAllPlayers(): Promise<void> {
  const players = parsePlayers();
  if (players.length === 0) {
    console.warn("[Refresh] No players configured");
    return;
  }

  console.log(`[Refresh] Updating ${players.length} players...`);

  const first = await fetchPlayerData(players[0].gameName, players[0].tagLine);
  if (!first) {
    console.error("[Refresh] First player failed. Check your RIOT_API_KEY (dev keys expire every 24h).");
    console.error("[Refresh] The server will keep running and retry in 10 minutes.");
    return;
  }

  const rest = players.slice(1);
  const restResults = await Promise.allSettled(
    rest.map((p) => fetchPlayerData(p.gameName, p.tagLine))
  );

  const restOk = restResults.filter((r) => r.status === "fulfilled" && r.value).length;
  const restFailed = restResults.filter((r) => r.status === "rejected" || !r.value).length;
  console.log(`[Refresh] Done: ${restOk + 1} succeeded, ${restFailed} failed`);

  saveLPSnapshot();
}

function rankToNumericLP(tier: string, rank: string, lp: number): number {
  const BASE: Record<string, number> = {
    IRON: 0, BRONZE: 400, SILVER: 800, GOLD: 1200,
    PLATINUM: 1600, EMERALD: 2000, DIAMOND: 2400,
    MASTER: 2800, GRANDMASTER: 3200, CHALLENGER: 3600,
  };
  const t = tier.toUpperCase();
  const base = BASE[t] || 0;
  if (["MASTER", "GRANDMASTER", "CHALLENGER"].includes(t)) {
    return base + lp;
  }
  const div: Record<string, number> = { I: 300, II: 200, III: 100, IV: 0 };
  return base + (div[rank] || 0) + lp;
}

function saveLPSnapshot(): void {
  const all = cache.getAllPlayers();
  const snapshot: LPSnapshot = {
    timestamp: Date.now(),
    players: all.map((p) => ({
      gameName: p.gameName,
      tier: p.rank.tier,
      rank: p.rank.rank,
      lp: p.rank.leaguePoints,
      numericLP: rankToNumericLP(p.rank.tier, p.rank.rank, p.rank.leaguePoints),
    })),
  };
  cache.addLPSnapshot(snapshot);
  console.log(`[LP] Snapshot saved (${snapshot.players.length} players)`);
}

function buildLeaderboard(): LeaderboardEntry[] {
  const allPlayers = cache.getAllPlayers();
  const sorted = allPlayers.sort((a, b) => b.points - a.points);

  return sorted.map((p, i) => ({
    rank: i + 1,
    gameName: p.gameName,
    tagLine: p.tagLine,
    profileIconId: p.profileIconId,
    currentRank: p.rank,
    stats: p.stats,
    points: p.points,
  }));
}

const app = express();
app.use(cors());
app.use(express.json());

const distPath = path.resolve(__dirname, "../../dist");
app.use(express.static(distPath));

app.get("/api/players", (_req, res) => {
  const players = cache.getAllPlayers();
  res.json({ players, lastUpdate: new Date().toISOString() });
});

app.get("/api/leaderboard", (_req, res) => {
  const leaderboard = buildLeaderboard();
  res.json({ leaderboard, lastUpdate: new Date().toISOString() });
});

app.get("/api/lp-history", (_req, res) => {
  const snapshots = cache.getLPSnapshots();
  res.json(snapshots);
});

app.get("/api/global-stats", (_req, res) => {
  const players = cache.getAllPlayers();
  const snapshots = cache.getLPSnapshots();

  const winrates = players.map((p) => p.stats.winrate).filter((w) => w > 0);
  const avgWinrate = winrates.length > 0
    ? winrates.reduce((a, b) => a + b, 0) / winrates.length
    : 0;

  const totalGames = players.reduce((s, p) => s + p.stats.gamesPlayed, 0);

  let playerOfDay: { gameName: string; lpGained: number } | null = null;
  if (snapshots.length >= 2) {
    const first = snapshots[0];
    const last = snapshots[snapshots.length - 1];
    let best = { gameName: "", lpGained: -Infinity };
    for (const fp of first.players) {
      const lp = last.players.find((lp) => lp.gameName === fp.gameName);
      if (lp) {
        const gained = lp.numericLP - fp.numericLP;
        if (gained > best.lpGained) {
          best = { gameName: fp.gameName, lpGained: gained };
        }
      }
    }
    if (best.lpGained > -Infinity) playerOfDay = best;
  }

  const champMap = new Map<string, {
    champion: string; wins: number; losses: number; playedBy: string;
  }>();
  for (const p of players) {
    for (const m of p.matches) {
      const key = m.champion;
      const existing = champMap.get(key);
      if (existing) {
        if (m.result === "Win") existing.wins++;
        else existing.losses++;
      } else {
        champMap.set(key, {
          champion: m.champion,
          wins: m.result === "Win" ? 1 : 0,
          losses: m.result === "Loss" ? 1 : 0,
          playedBy: p.gameName,
        });
      }
    }
  }
  const topChampions = Array.from(champMap.values())
    .map((c) => ({
      ...c,
      championIcon: `https://ddragon.leagueoflegends.com/cdn/14.8.1/img/champion/${c.champion}.png`,
      winrate: c.wins + c.losses > 0 ? c.wins / (c.wins + c.losses) : 0,
    }))
    .filter((c) => c.wins + c.losses >= 2)
    .sort((a, b) => b.winrate - a.winrate || b.wins - a.wins)
    .slice(0, 5);

  res.json({ avgWinrate, totalGames, playerOfDay, topChampions });
});

app.get("/api/seed-mock", async (_req, res) => {
  const players = cache.getAllPlayers();
  if (players.length < 2) {
    return res.json({ error: "Need real player data first. Run /api/refresh to fetch from RIOT." });
  }

  const champions = ["Ahri","Lee Sin","Thresh","Kai'Sa","Akali","Ezreal","Lux","Yasuo","Zed","Jhin","Viego","Katarina","Darius","Caitlyn","Jinx","Leona","Nautilus","Pyke","Yone","Aatrox"];
  const shuffle = <T>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);
  const pick = <T>(arr: T[], n: number) => shuffle(arr).slice(0, n);

  for (const p of players) {
    const champs = pick(champions, 5);
    const matches: import("../../src/types.js").MatchInfo[] = [];
    for (let i = 0; i < 12; i++) {
      const champ = champs[i % champs.length];
      const win = Math.random() > 0.42;
      const k = Math.floor(Math.random() * 15) + 1;
      const d = Math.floor(Math.random() * 9);
      const a = Math.floor(Math.random() * 15);
      const cs = Math.floor(Math.random() * 100) + 150;
      matches.push({
        matchId: `MOCK_${p.puuid}_${i}`,
        timestamp: Date.now() - (i * 3600000 + Math.random() * 7200000),
        champion: champ,
        championIcon: `https://ddragon.leagueoflegends.com/cdn/14.8.1/img/champion/${champ}.png`,
        result: win ? "Win" : "Loss",
        kills: k, deaths: d, assists: a,
        kda: d === 0 ? k + a : (k + a) / d,
        cs,
        duration: `${20 + Math.floor(Math.random() * 20)}:${Math.floor(Math.random() * 60).toString().padStart(2, "0")}`,
        lpChange: win ? (15 + Math.floor(Math.random() * 10)) : -(15 + Math.floor(Math.random() * 10)),
        gameMode: "SoloQ",
      });
    }
    p.matches = matches;
    const wins = matches.filter((m) => m.result === "Win").length;
    p.stats = {
      gamesPlayed: 12, wins, losses: 12 - wins,
      winrate: wins / 12,
      avgKills: matches.reduce((s, m) => s + m.kills, 0) / 12,
      avgDeaths: matches.reduce((s, m) => s + m.deaths, 0) / 12,
      avgAssists: matches.reduce((s, m) => s + m.assists, 0) / 12,
      avgKDA: matches.reduce((s, m) => s + m.kda, 0) / 12,
      avgCS: matches.reduce((s, m) => s + m.cs, 0) / 12,
      totalLPChange: matches.reduce((s, m) => s + m.lpChange, 0),
    };
    p.points = Math.max(0, matches.reduce((s, m) => s + (m.kda >= 3 ? 3 : 0) + (m.result === "Win" ? 10 : -5), 0));
    cache.setPlayer(p.gameName, p);
  }

  const snapshots: import("./lp-history.js").LPSnapshot[] = [];
  const now = Date.now();
  for (let h = 24; h >= 0; h -= 2) {
    const ts = now - h * 3600000;
    snapshots.push({
      timestamp: ts,
      players: players.map((p) => {
        const base = p.rank.tier === "MASTER" ? 2800 : p.rank.tier === "DIAMOND" ? 2400 : p.rank.tier === "PLATINUM" ? 1800 : p.rank.tier === "GOLD" ? 1400 : p.rank.tier === "SILVER" ? 900 : 1200;
        const offset = Math.sin(h * 0.8 + players.indexOf(p)) * 100;
        const lp = Math.floor(base + p.rank.leaguePoints + offset + Math.random() * 30 - 15);
        return { gameName: p.gameName, tier: p.rank.tier, rank: p.rank.rank, lp, numericLP: lp };
      }),
    });
  }
  snapshots.forEach((s) => cache.addLPSnapshot(s));

  res.json({ status: "ok", seeded: players.length, snapshots: snapshots.length });
});

app.get("/api/players/:gameName", (req, res) => {
  const player = cache.getPlayer(req.params.gameName);
  if (!player) {
    return res.status(404).json({ error: "Player not found" });
  }
  res.json(player);
});

app.get("/api/refresh", async (_req, res) => {
  res.json({ status: "started" });
  try {
    await refreshAllPlayers();
    console.log("[API] Manual refresh complete");
  } catch (err) {
    console.error("[API] Manual refresh failed:", err);
  }
});

app.get("*", (_req, res) => {
  res.sendFile(path.resolve(distPath, "index.html"));
});

async function start(): Promise<void> {
  if (!RIOT_API_KEY || RIOT_API_KEY.includes("your-key")) {
    console.warn("========================================");
    console.warn(" RIOT_API_KEY not configured!");
    console.warn(" Set it in .env file or environment variables");
    console.warn(" Get a key at: https://developer.riotgames.com/");
    console.warn("========================================");
  }

  await refreshAllPlayers();

  setInterval(async () => {
    console.log("[Cron] 10-minute refresh triggered");
    await refreshAllPlayers();
  }, UPDATE_INTERVAL);

  app.listen(PORT, () => {
    console.log(`[Server] Running on http://localhost:${PORT}`);
    console.log(`[Server] API: http://localhost:${PORT}/api/players`);
    console.log(`[Server] Refresh: http://localhost:${PORT}/api/refresh`);
  });
}

start().catch(console.error);
