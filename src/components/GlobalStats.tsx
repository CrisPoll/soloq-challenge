import { useEffect, useState, useMemo } from "react";
import type { PlayerData } from "../types";
import type { GlobalStats as GlobalStatsType } from "../types";

function SkeletonBlock() {
  return (
    <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-3.5 space-y-3.5" aria-hidden="true">
      <div className="bg-zinc-800/60 rounded-lg p-3 -m-1 space-y-2">
        <div className="h-3 w-24 skeleton rounded" />
        <div className="h-7 w-16 skeleton rounded" />
        <div className="h-3 w-20 skeleton rounded" />
      </div>
      <div className="border-t border-zinc-800 pt-3.5 space-y-2">
        <div className="h-3 w-20 skeleton rounded" />
        <div className="h-5 w-28 skeleton rounded" />
      </div>
      <div className="border-t border-zinc-800 pt-3.5 space-y-2">
        <div className="h-3 w-20 skeleton rounded" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full skeleton flex-shrink-0" />
            <div className="h-4 flex-1 skeleton rounded" />
            <div className="h-4 w-10 skeleton rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function GlobalStats({ players }: { players: PlayerData[] }) {
  const [stats, setStats] = useState<GlobalStatsType | null>(null);

  useEffect(() => {
    fetch("/api/global-stats")
      .then((r) => r.json())
      .then(setStats)
      .catch(() => {});
    const interval = setInterval(() => {
      fetch("/api/global-stats")
        .then((r) => r.json())
        .then(setStats)
        .catch(() => {});
    }, 60_000);
    return () => clearInterval(interval);
  }, []);

  const topWinrates = [...players]
    .filter((p) => p.stats.gamesPlayed > 0)
    .sort((a, b) => b.stats.winrate - a.stats.winrate)
    .slice(0, 3);

  const recentMatches = useMemo(
    () =>
      players
        .flatMap((p) => p.matches.map((m) => ({ ...m, playerName: p.gameName })))
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 5),
    [players]
  );

  if (!stats) return <SkeletonBlock />;

  return (
    <div className="space-y-4">
      <h3
        className="text-xs font-semibold text-zinc-400 uppercase tracking-[0.15em] px-1"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Stats Globales
      </h3>

      <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-3.5 space-y-3.5">
        <div className="bg-zinc-800/60 rounded-lg p-3 -m-1">
          <div className="flex items-center gap-2 mb-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-400 flex-shrink-0" aria-hidden="true">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
            <span className="text-[11px] text-zinc-500 uppercase tracking-wider">Winrate del Team</span>
          </div>
          <p className="text-xl font-bold tabular-nums text-green-400" style={{ fontFamily: "var(--font-display)" }}>
            {(stats.avgWinrate * 100).toFixed(1)}%
          </p>
          <p className="text-[11px] text-zinc-500 mt-0.5">{stats.totalGames} partidas</p>
        </div>

        <div className="border-t border-zinc-800 pt-3.5">
          <div className="flex items-center gap-2 mb-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-yellow-400 flex-shrink-0" aria-hidden="true">
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
              <polyline points="17 6 23 6 23 12" />
            </svg>
            <span className="text-[11px] text-zinc-500 uppercase tracking-wider">Jugador del Día</span>
          </div>
          {stats.playerOfDay ? (
            <div>
              <p className="text-sm font-bold text-white uppercase truncate" style={{ fontFamily: "var(--font-display)" }}>
                {stats.playerOfDay.gameName}
              </p>
              {(() => {
                const delta = stats.playerOfDay.lpGained;
                const absDelta = Math.abs(delta);
                const prefix = delta > 0 ? "+" : delta < 0 ? "-" : "±";
                const deltaColor = delta > 0 ? "text-green-400" : delta < 0 ? "text-red-400" : "text-zinc-400";
                return (
                  <p className={`text-xs font-semibold tabular-nums ${deltaColor}`}>
                    {delta === 0 ? "±0" : `${prefix}${absDelta}`} LP
                  </p>
                );
              })()}
            </div>
          ) : (
            <p className="text-xs text-zinc-500">Sin datos aún</p>
          )}
        </div>

        <div className="border-t border-zinc-800 pt-3.5">
          <div className="flex items-center gap-2 mb-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-purple-400 flex-shrink-0" aria-hidden="true">
              <path d="M18 20V10M12 20V4M6 20v-6" />
            </svg>
            <span className="text-[11px] text-zinc-500 uppercase tracking-wider">Top Campeones</span>
          </div>
          {stats.topChampions.length === 0 ? (
            <p className="text-xs text-zinc-500">Sin datos</p>
          ) : (
            <div className="space-y-1.5">
              {stats.topChampions.slice(0, 3).map((c, i) => (
                <div key={c.champion} className="flex items-center gap-2">
                  <span className="text-xs text-zinc-500 w-3 tabular-nums">{i + 1}</span>
                  <img
                    src={c.championIcon}
                    alt={c.champion}
                    className="w-6 h-6 rounded-full border border-white/5 aspect-square flex-shrink-0"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-white font-medium truncate">{c.champion}</p>
                    <p className="text-[11px] text-zinc-500">{c.playedBy}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-semibold text-green-400 tabular-nums">
                      {(c.winrate * 100).toFixed(0)}%
                    </p>
                    <p className="text-[11px] text-zinc-500 tabular-nums">{c.wins}W {c.losses}L</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-3.5 space-y-2.5 mb-4">
        <div className="flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-cyan-400 flex-shrink-0" aria-hidden="true">
            <path d="M12 20V10M18 20V4M6 20v-6" />
          </svg>
          <span className="text-[11px] text-zinc-500 uppercase tracking-wider">Top Winrates</span>
        </div>
        {topWinrates.length === 0 ? (
          <p className="text-xs text-zinc-500">Sin datos</p>
        ) : (
          <div className="space-y-1.5">
            {topWinrates.map((p, i) => (
              <div key={p.puuid} className="flex items-center gap-2">
                <span className="text-xs text-zinc-500 w-3 tabular-nums">{i + 1}</span>
                <img
                  src={`https://ddragon.leagueoflegends.com/cdn/14.8.1/img/profileicon/${p.profileIconId}.png`}
                  alt={p.gameName}
                  className="w-6 h-6 rounded-full border border-white/5 aspect-square flex-shrink-0"
                  onError={(e) => { (e.target as HTMLImageElement).src = "https://ddragon.leagueoflegends.com/cdn/14.8.1/img/profileicon/29.png"; }}
                />
                <span className="text-xs text-white font-medium truncate flex-1">{p.gameName}</span>
                <span className="text-xs font-semibold text-green-400 tabular-nums">
                  {(p.stats.winrate * 100).toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {recentMatches.length > 0 && (
        <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-3.5 space-y-2.5">
          <div className="flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-orange-400 flex-shrink-0" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span className="text-[11px] text-zinc-500 uppercase tracking-wider">Últimas Partidas</span>
          </div>
          <div className="space-y-1">
            {recentMatches.map((m, i) => (
              <div key={m.matchId + i} className="flex items-center gap-1.5 text-xs">
                <span className={`font-bold w-4 flex-shrink-0 ${m.result === "Win" ? "text-green-400" : "text-red-400"}`}>
                  {m.result === "Win" ? "W" : "L"}
                </span>
                <span className="text-zinc-400 truncate flex-1">{m.playerName}</span>
                <span className="text-zinc-500 flex-shrink-0 tabular-nums">{m.kills}/{m.deaths}/{m.assists}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
