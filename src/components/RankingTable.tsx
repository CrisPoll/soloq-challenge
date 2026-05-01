import type { PlayerData } from "../types";
import { PLAYER_COLORS, TIER_COLORS, TIER_GLOW, TIER_CARD_GRADIENTS, getRankIcon, rankScore } from "../constants";

function wrColor(wr: number): string {
  if (wr >= 0.55) return "text-green-400";
  if (wr >= 0.50) return "text-yellow-400";
  return "text-red-400";
}

interface Props {
  players: PlayerData[];
  loading: boolean;
  onPlayerClick?: (player: PlayerData) => void;
}

export default function RankingTable({ players, loading, onPlayerClick }: Props) {
  const sorted = [...players].sort(
    (a, b) => rankScore(b.rank.tier, b.rank.rank, b.rank.leaguePoints) -
             rankScore(a.rank.tier, a.rank.rank, a.rank.leaguePoints)
  );

  if (loading && players.length === 0) {
    return (
      <div className="w-full space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-[72px] skeleton rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="w-full space-y-2" role="list">
      {sorted.map((player, i) => {
        const tierColor = TIER_COLORS[player.rank.tier] || "#78716c";
        const glow = TIER_GLOW[player.rank.tier] || "";
        const gradient = TIER_CARD_GRADIENTS[player.rank.tier] || "from-zinc-500/10 to-zinc-600/5";
        const borderColor = PLAYER_COLORS[i] || "#555";
        const wr = player.stats.wins + player.stats.losses > 0
          ? player.stats.wins / (player.stats.wins + player.stats.losses)
          : 0;
        const wrPct = (wr * 100).toFixed(0);

        return (
          <div
            key={player.puuid}
            role="button"
            tabIndex={0}
            className="focus-ring group flex items-center gap-5 px-5 py-4 bg-zinc-900/50 border border-l-[3px] border-r-transparent border-t-white/5 border-b-white/5 rounded-xl hover:bg-zinc-800/60 hover:-translate-y-[1px] transition-all duration-150 animate-fade-in cursor-pointer shadow-[0_2px_8px_rgba(0,0,0,0.4)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.6)]"
            style={{
              animationDelay: `${i * 50}ms`, opacity: 0,
              borderLeftColor: borderColor,
            }}
            onClick={() => onPlayerClick?.(player)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onPlayerClick?.(player);
              }
            }}
          >
            <div className="flex items-center justify-center w-8 flex-shrink-0">
              {i === 0 ? (
                <span className="text-[#F59E0B] text-lg font-bold" style={{ fontFamily: "var(--font-display)", textShadow: "0 0 12px rgba(245, 158, 11, 0.5)" }}>1</span>
              ) : i === 1 ? (
                <span className="text-zinc-300 text-lg font-bold" style={{ fontFamily: "var(--font-display)", textShadow: "0 0 8px rgba(212, 212, 216, 0.3)" }}>2</span>
              ) : i === 2 ? (
                <span className="text-amber-500 text-lg font-bold" style={{ fontFamily: "var(--font-display)", textShadow: "0 0 8px rgba(245, 158, 11, 0.3)" }}>3</span>
              ) : (
                <span className="text-zinc-500 text-sm font-semibold">{i + 1}</span>
              )}
            </div>

            <img
              src={`https://ddragon.leagueoflegends.com/cdn/14.8.1/img/profileicon/${player.profileIconId}.png`}
              alt={player.gameName}
              className="w-10 h-10 rounded-full border border-white/10 flex-shrink-0 aspect-square"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "https://ddragon.leagueoflegends.com/cdn/14.8.1/img/profileicon/29.png";
              }}
            />

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span
                  className="text-base font-bold uppercase tracking-wide truncate"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {player.gameName}
                </span>
                <span className="text-xs text-zinc-500 font-normal flex-shrink-0">
                  #{player.tagLine}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-zinc-400 tabular-nums">
                  {player.stats.wins}<span className="text-green-400/80">W</span>
                  {" / "}
                  {player.stats.losses}<span className="text-red-400/80">L</span>
                </span>
                {player.stats.wins === 0 && player.stats.losses === 0 ? (
                  <span className="text-xs font-semibold tabular-nums text-zinc-500">— WR</span>
                ) : (
                  <span className={`text-xs font-semibold tabular-nums ${wrColor(wr)}`}>
                    {wrPct}% WR
                  </span>
                )}
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-4 flex-shrink-0">
              <div className="flex flex-col items-end gap-0.5">
                <span className="text-xs tabular-nums text-zinc-400">
                  <span className="text-zinc-300 font-medium">{player.stats.avgKDA.toFixed(1)}</span>
                  <span className="text-zinc-500"> KDA</span>
                </span>
                <span className="text-xs tabular-nums text-zinc-500">
                  <span className="text-zinc-400">{player.stats.avgCS.toFixed(0)}</span>
                  <span className="text-zinc-500"> CS</span>
                </span>
              </div>

              <div className={`px-3 py-2 rounded-lg bg-gradient-to-b ${gradient} border border-white/5 flex items-center gap-2 min-w-[130px]`}>
                <img
                  src={getRankIcon(player.rank.tier)}
                  alt={player.rank.tier}
                  className="w-6 h-6"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
                <div className="leading-tight">
                  <span
                    className={`text-xs font-bold uppercase tabular-nums block ${glow}`}
                    style={{ color: tierColor, fontFamily: "var(--font-display)" }}
                  >
                    {player.rank.tier} {player.rank.rank}
                  </span>
                  <span className="text-[11px] text-zinc-400 tabular-nums">{player.rank.leaguePoints} LP</span>
                </div>
              </div>
            </div>

            <div className="sm:hidden flex items-center gap-2 flex-shrink-0">
              <img
                src={getRankIcon(player.rank.tier)}
                alt={player.rank.tier}
                className="w-6 h-6"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
              <span
                className={`text-xs font-bold uppercase tabular-nums ${glow}`}
                style={{ color: tierColor, fontFamily: "var(--font-display)" }}
              >
                {player.rank.tier} {player.rank.rank}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
