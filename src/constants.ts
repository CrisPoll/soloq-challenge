export const PLAYER_COLORS = [
  "#FF6B6B", "#4ECDC4", "#FFD93D", "#6C5CE7", "#A8E6CF",
  "#FF8C42", "#45B7D1", "#F7DC6F", "#BB8FCE",
];

export const TIER_COLORS: Record<string, string> = {
  CHALLENGER: "#facc15", GRANDMASTER: "#ef4444", MASTER: "#a855f7",
  DIAMOND: "#38bdf8", EMERALD: "#34d399", PLATINUM: "#2dd4bf",
  GOLD: "#facc15", SILVER: "#a1a1aa", BRONZE: "#d97706", IRON: "#78716c",
};

export const TIER_GRADIENTS: Record<string, string> = {
  CHALLENGER: "from-amber-300 to-yellow-500",
  GRANDMASTER: "from-red-400 to-red-600",
  MASTER: "from-purple-400 to-purple-600",
  DIAMOND: "from-cyan-400 to-blue-500",
  EMERALD: "from-emerald-400 to-green-600",
  PLATINUM: "from-teal-400 to-teal-600",
  GOLD: "from-yellow-400 to-amber-500",
  SILVER: "from-slate-300 to-slate-400",
  BRONZE: "from-orange-400 to-orange-700",
  IRON: "from-stone-400 to-stone-600",
};

export const TIER_CARD_GRADIENTS: Record<string, string> = {
  CHALLENGER: "from-yellow-500/20 to-amber-500/5",
  GRANDMASTER: "from-red-500/20 to-red-600/5",
  MASTER: "from-purple-500/20 to-purple-600/5",
  DIAMOND: "from-cyan-500/15 to-sky-500/5",
  EMERALD: "from-emerald-500/15 to-emerald-600/5",
  PLATINUM: "from-teal-500/15 to-teal-600/5",
  GOLD: "from-yellow-500/10 to-amber-500/5",
  SILVER: "from-zinc-400/10 to-zinc-500/5",
  BRONZE: "from-amber-700/10 to-amber-800/5",
  IRON: "from-stone-500/10 to-stone-600/5",
};

export const TIER_GLOW: Record<string, string> = {
  CHALLENGER: "glow-diamond", GRANDMASTER: "glow-master", MASTER: "glow-master",
  DIAMOND: "glow-diamond", EMERALD: "glow-platinum", PLATINUM: "glow-platinum",
  GOLD: "glow-gold", SILVER: "glow-silver", BRONZE: "glow-silver", IRON: "glow-silver",
};

export const TIER_ORDER: Record<string, number> = {
  CHALLENGER: 9, GRANDMASTER: 8, MASTER: 7, DIAMOND: 6, EMERALD: 5,
  PLATINUM: 4, GOLD: 3, SILVER: 2, BRONZE: 1, IRON: 0,
};

export function getRankIcon(tier: string): string {
  return `https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-shared-components/global/default/${tier.toLowerCase()}.png`;
}

export function rankScore(tier: string, rank: string, lp: number): number {
  const t = tier.toUpperCase();
  const base = (TIER_ORDER[t] || 0) * 1000;
  if (["MASTER", "GRANDMASTER", "CHALLENGER"].includes(t)) return base + lp;
  const div: Record<string, number> = { I: 300, II: 200, III: 100, IV: 0 };
  return base + (div[rank] || 0) + lp;
}
