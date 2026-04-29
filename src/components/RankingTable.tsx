import type { PlayerData } from "../types";

const PLAYER_COLORS = [
  "#FF6B6B", "#4ECDC4", "#FFD93D", "#6C5CE7", "#A8E6CF",
  "#FF8C42", "#45B7D1", "#F7DC6F", "#BB8FCE",
];

const TIER_GLOW: Record<string, string> = {
  CHALLENGER: "glow-diamond", GRANDMASTER: "glow-master", MASTER: "glow-master",
  DIAMOND: "glow-diamond", EMERALD: "glow-platinum", PLATINUM: "glow-platinum",
  GOLD: "glow-gold", SILVER: "glow-silver", BRONZE: "glow-silver", IRON: "glow-silver",
};

const TIER_GRADIENT: Record<string, string> = {
  CHALLENGER: "from-yellow-500/20 to-amber-500/5", GRANDMASTER: "from-red-500/20 to-red-600/5",
  MASTER: "from-purple-500/20 to-purple-600/5", DIAMOND: "from-cyan-500/15 to-sky-500/5",
  EMERALD: "from-emerald-500/15 to-emerald-600/5", PLATINUM: "from-teal-500/15 to-teal-600/5",
  GOLD: "from-yellow-500/10 to-amber-500/5", SILVER: "from-zinc-400/10 to-zinc-500/5",
  BRONZE: "from-amber-700/10 to-amber-800/5", IRON: "from-stone-500/10 to-stone-600/5",
};

const TIER_ORDER: Record<string, number> = {
  CHALLENGER: 9, GRANDMASTER: 8, MASTER: 7, DIAMOND: 6, EMERALD: 5,
  PLATINUM: 4, GOLD: 3, SILVER: 2, BRONZE: 1, IRON: 0,
};

function rankScore(tier: string, rank: string, lp: number): number {
  const t = tier.toUpperCase();
  const base = (TIER_ORDER[t] || 0) * 1000;
  if (["MASTER", "GRANDMASTER", "CHALLENGER"].includes(t)) return base + lp;
  const div: Record<string, number> = { I: 300, II: 200, III: 100, IV: 0 };
  return base + (div[rank] || 0) + lp;
}

function wrColor(wr: number): string {
  if (wr >= 0.55) return "text-green-400";
  if (wr >= 0.50) return "text-yellow-400";
  return "text-red-400";
}

function getRankIcon(tier: string): string {
  return `https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-shared-components/global/default/${tier.toLowerCase()}.png`;
}

const TIER_COLORS: Record<string, string> = {
  CHALLENGER: "#facc15", GRANDMASTER: "#ef4444", MASTER: "#a855f7",
  DIAMOND: "#38bdf8", EMERALD: "#34d399", PLATINUM: "#2dd4bf",
  GOLD: "#facc15", SILVER: "#a1a1aa", BRONZE: "#d97706", IRON: "#78716c",
};

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
    <div className="w-full space-y-2">
      {sorted.map((player, i) => {
        const tierColor = TIER_COLORS[player.rank.tier] || "#78716c";
        const glow = TIER_GLOW[player.rank.tier] || "";
        const gradient = TIER_GRADIENT[player.rank.tier] || "from-zinc-500/10 to-zinc-600/5";
        const borderColor = PLAYER_COLORS[i] || "#555";
        const wr = player.stats.wins + player.stats.losses > 0
          ? player.stats.wins / (player.stats.wins + player.stats.losses)
          : 0;
        const wrPct = (wr * 100).toFixed(0);

        return (
          <div
            key={player.puuid}
            className="group flex items-center gap-5 px-5 py-4 bg-zinc-900/50 border border-l-2 border-white/5 rounded-xl hover:bg-zinc-800/60 transition-all duration-200 animate-fade-in cursor-pointer"
            style={{
              animationDelay: `${i * 50}ms`, opacity: 0,
              borderLeftColor: borderColor,
            }}
            onClick={() => onPlayerClick?.(player)}
          >
            <div className="flex items-center justify-center w-8 flex-shrink-0">
              {i === 0 ? (
                <span className="text-yellow-400 text-lg font-bold" style={{ fontFamily: "var(--font-display)" }}>1</span>
              ) : i === 1 ? (
                <span className="text-zinc-300 text-lg font-bold" style={{ fontFamily: "var(--font-display)" }}>2</span>
              ) : i === 2 ? (
                <span className="text-amber-700 text-lg font-bold" style={{ fontFamily: "var(--font-display)" }}>3</span>
              ) : (
                <span className="text-zinc-500 text-sm font-semibold">{i + 1}</span>
              )}
            </div>

            <img
              src={`https://ddragon.leagueoflegends.com/cdn/14.8.1/img/profileicon/${player.profileIconId}.png`}
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
                <span className="text-xs text-zinc-600 font-normal flex-shrink-0">
                  #{player.tagLine}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[11px] text-zinc-400 tabular-nums">
                  {player.stats.wins}<span className="text-green-400/80">W</span>
                  {" / "}
                  {player.stats.losses}<span className="text-red-400/80">L</span>
                </span>
                <span className={`text-[11px] font-semibold tabular-nums ${wrColor(wr)}`}>
                  {wrPct}% WR
                </span>
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-4 flex-shrink-0">
              <div className="flex flex-col items-end gap-0.5">
                <span className="text-[11px] tabular-nums text-zinc-400">
                  <span className="text-zinc-300 font-medium">{player.stats.avgKDA.toFixed(1)}</span>
                  <span className="text-zinc-600"> KDA</span>
                </span>
                <span className="text-[11px] tabular-nums text-zinc-500">
                  <span className="text-zinc-400">{player.stats.avgCS.toFixed(0)}</span>
                  <span className="text-zinc-600"> CS</span>
                </span>
              </div>

              <div className={`px-3 py-1.5 rounded-lg bg-gradient-to-b ${gradient} border border-white/5 flex items-center gap-2 min-w-[150px]`}>
                <img
                  src={getRankIcon(player.rank.tier)}
                  className="w-6 h-6"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
                <div>
                  <span
                    className={`text-xs font-bold uppercase tabular-nums ${glow}`}
                    style={{ color: tierColor, fontFamily: "var(--font-display)" }}
                  >
                    {player.rank.tier} {player.rank.rank}
                  </span>
                  <span className="text-[10px] text-zinc-400 ml-1 tabular-nums">{player.rank.leaguePoints} LP</span>
                </div>
              </div>
            </div>

            <div className="sm:hidden flex items-center gap-2 flex-shrink-0">
              <img
                src={getRankIcon(player.rank.tier)}
                className="w-6 h-6"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
              <span
                className={`text-[10px] font-bold uppercase tabular-nums ${glow}`}
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
