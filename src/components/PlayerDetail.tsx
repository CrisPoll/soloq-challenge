import type { PlayerData } from "../types";

export default function PlayerDetail({ player, onClose }: { player: PlayerData; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto scrollbar-thin animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-zinc-900/95 backdrop-blur-sm border-b border-white/5 p-5 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <img
              src={`https://ddragon.leagueoflegends.com/cdn/14.8.1/img/profileicon/${player.profileIconId}.png`}
              className="w-11 h-11 rounded-full border border-white/10 aspect-square"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "https://ddragon.leagueoflegends.com/cdn/14.8.1/img/profileicon/29.png";
              }}
            />
            <div>
              <h2
                className="text-lg font-bold uppercase tracking-wider"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {player.gameName}{" "}
                <span className="text-zinc-500 text-sm">#{player.tagLine}</span>
              </h2>
              <p className="text-xs text-zinc-400">
                {player.rank.tier} {player.rank.rank} · {player.rank.leaguePoints} LP · Nivel {player.summonerLevel}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/5 text-zinc-500 hover:text-white transition-colors cursor-pointer"
          >
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <path d="M15 5L5 15M5 5l10 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="p-5 space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Partidas", value: player.stats.gamesPlayed },
              {
                label: "Winrate",
                value: `${(player.stats.winrate * 100).toFixed(0)}%`,
                cls: player.stats.winrate >= 0.5 ? "text-green-400" : "text-red-400",
              },
              { label: "KDA", value: player.stats.avgKDA.toFixed(2) },
              { label: "Puntos", value: player.points, cls: "text-yellow-400" },
            ].map((s) => (
              <div key={s.label} className="bg-zinc-800/50 border border-white/5 rounded-xl p-3 text-center">
                <p
                  className={`text-xl font-bold tabular-nums ${s.cls || "text-white"}`}
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {s.value}
                </p>
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-4 gap-3 text-center">
            {[
              {
                label: "K/D/A",
                value: `${player.stats.avgKills.toFixed(1)}/${player.stats.avgDeaths.toFixed(1)}/${player.stats.avgAssists.toFixed(1)}`,
              },
              { label: "CS Avg", value: player.stats.avgCS.toFixed(0) },
              {
                label: "LP Total",
                value: `${player.stats.totalLPChange >= 0 ? "+" : ""}${player.stats.totalLPChange}`,
                cls: player.stats.totalLPChange >= 0 ? "text-green-400" : "text-red-400",
              },
              { label: "Nivel", value: player.summonerLevel },
            ].map((s) => (
              <div key={s.label} className="bg-zinc-800/30 rounded-lg p-2.5">
                <p className={`text-sm font-semibold tabular-nums ${s.cls || "text-white"}`}>{s.value}</p>
                <p className="text-[10px] text-zinc-500 uppercase mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          <div>
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-[0.15em] mb-3">
              Últimas partidas
            </h3>
            {player.matches.length === 0 ? (
              <p className="text-zinc-600 text-sm py-8 text-center">Sin partidas recientes</p>
            ) : (
              <div className="space-y-1.5 max-h-[360px] overflow-y-auto scrollbar-thin pr-1">
                {player.matches.slice(0, 15).map((match) => (
                  <div
                    key={match.matchId}
                    className={`flex items-center gap-3 p-2.5 rounded-lg border ${
                      match.result === "Win"
                        ? "bg-green-400/3 border-green-400/10"
                        : "bg-red-400/3 border-red-400/10"
                    }`}
                  >
                    <img
                      src={match.championIcon}
                      className="w-8 h-8 rounded-full aspect-square border border-white/10 flex-shrink-0"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold ${match.result === "Win" ? "text-green-400" : "text-red-400"}`}>
                          {match.result === "Win" ? "Victoria" : "Derrota"}
                        </span>
                        <span className="text-xs text-zinc-500">{match.duration}</span>
                      </div>
                      <p className="text-sm text-white truncate mt-0.5">
                        <span className="font-medium">{match.champion}</span>
                        <span className="text-zinc-400 ml-1.5">
                          {match.kills}/{match.deaths}/{match.assists} · {match.kda.toFixed(1)} KDA · {match.cs} CS
                        </span>
                      </p>
                    </div>
                    <span className={`text-sm font-bold tabular-nums flex-shrink-0 ${match.lpChange >= 0 ? "text-green-400" : "text-red-400"}`}>
                      {match.lpChange >= 0 ? "+" : ""}{match.lpChange} LP
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
