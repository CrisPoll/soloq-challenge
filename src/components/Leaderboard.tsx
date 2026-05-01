import type { PlayerData, RankInfo } from "../types";
import { TIER_GRADIENTS, getRankIcon } from "../constants";

function RankBadge({ rank }: { rank: RankInfo }) {
  if (rank.tier === "UNRANKED") {
    return (
      <div className="flex items-center gap-2">
        <div className="w-10 h-10 rounded-full bg-slate-700/50 flex items-center justify-center">
          <span className="text-slate-400 text-xs font-bold">?</span>
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-400">Unranked</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <img
        src={getRankIcon(rank.tier)}
        alt={rank.tier}
        className="w-10 h-10 rounded-full"
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = "none";
        }}
      />
      <div>
        <p className="text-sm font-semibold text-white">
          {rank.tier} {rank.rank}
        </p>
        <p className="text-xs text-slate-400">{rank.leaguePoints} LP</p>
      </div>
    </div>
  );
}

interface Props {
  players: PlayerData[];
  loading: boolean;
  startRank?: number;
}

function SkeletonCard() {
  return (
    <div className="glass-card p-6">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-full skeleton" />
        <div className="flex-1 space-y-2">
          <div className="h-5 w-32 skeleton rounded" />
          <div className="h-4 w-24 skeleton rounded" />
        </div>
        <div className="h-8 w-16 skeleton rounded" />
      </div>
    </div>
  );
}

export default function Leaderboard({ players, loading, startRank = 1 }: Props) {
  if (loading && players.length === 0) {
    return (
      <div className="w-full max-w-6xl mx-auto px-4 space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (!loading && players.length === 0) {
    return (
      <div className="w-full max-w-6xl mx-auto px-4 text-center py-20">
        <p className="text-slate-500 text-lg">No hay jugadores configurados.</p>
        <p className="text-slate-600 text-sm mt-2">
          Agrega jugadores en el archivo .env usando PLAYERS=Nombre#TAG
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-4 space-y-3">
      {players.map((player, i) => {
        const pos = startRank + i;
        const isFirst = pos === 1;
        const isSecond = pos === 2;
        const isThird = pos === 3;
        const tierGradient = TIER_GRADIENTS[player.rank.tier] || "from-slate-400 to-slate-600";

        return (
          <div
            key={player.puuid}
            className="glass-card p-4 sm:p-5 hover:border-accent/30 transition-all duration-300 animate-fade-in group"
            style={{ animationDelay: `${i * 80}ms`, opacity: 0 }}
          >
            <div className="flex items-center gap-3 sm:gap-5">
              <div className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-bg-primary flex-shrink-0">
                {isFirst ? (
                  <span className="text-amber-400 text-lg font-bold">1</span>
                ) : isSecond ? (
                  <span className="text-slate-300 text-lg font-bold">2</span>
                ) : isThird ? (
                  <span className="text-amber-500 text-lg font-bold">3</span>
                ) : (
                  <span className="text-slate-500 text-sm font-semibold">
                    {pos}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3 flex-1 min-w-0">
                <img
                  src={`https://ddragon.leagueoflegends.com/cdn/14.8.1/img/profileicon/${player.profileIconId}.png`}
                  alt={player.gameName}
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-border flex-shrink-0"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      "https://ddragon.leagueoflegends.com/cdn/14.8.1/img/profileicon/29.png";
                  }}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm sm:text-base font-bold text-white truncate">
                      {player.gameName}
                    </p>
                    <span className="text-xs text-slate-500">
                      #{player.tagLine}
                    </span>
                    {player.rank.tier !== "UNRANKED" && (
                      <span
                        className={`hidden sm:inline text-[10px] px-1.5 py-0.5 rounded font-semibold bg-gradient-to-r ${tierGradient} text-white/90`}
                      >
                        {player.rank.tier} {player.rank.rank}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                    <span>{player.rank.leaguePoints} LP</span>
                    <span>·</span>
                    <span className="text-win">
                      {player.stats.wins}W
                    </span>
                    <span className="text-loss">
                      {player.stats.losses}L
                    </span>
                    <span>·</span>
                    <span>
                      {player.stats.winrate > 0
                        ? `${(player.stats.winrate * 100).toFixed(0)}% WR`
                        : "—"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="hidden sm:flex items-center gap-4 text-center flex-shrink-0">
                <div>
                  <p className="text-lg font-bold text-white">
                    {player.stats.avgKDA.toFixed(1)}
                  </p>
                  <p className="text-xs text-slate-500 uppercase">KDA</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-white">
                    {player.stats.avgCS.toFixed(0)}
                  </p>
                  <p className="text-xs text-slate-500 uppercase">CS</p>
                </div>
                <div>
                  <p
                    className={`text-lg font-bold ${
                      player.stats.totalLPChange >= 0
                        ? "text-win"
                        : "text-loss"
                    }`}
                  >
                    {player.stats.totalLPChange >= 0 ? "+" : ""}
                    {player.stats.totalLPChange}
                  </p>
                  <p className="text-xs text-slate-500 uppercase">LP</p>
                </div>
              </div>

              <div className="flex-shrink-0 text-right">
                <p className="text-xl sm:text-2xl font-extrabold text-accent">
                  {player.points}
                </p>
                <p className="text-xs text-slate-500 uppercase tracking-wider">
                  PTS
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
