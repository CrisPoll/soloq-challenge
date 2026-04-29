import { useEffect, useState, useMemo } from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Area, ComposedChart,
} from "recharts";
import type { LPSnapshot, PlayerData } from "../types";

const PLAYER_COLORS = [
  "#FF6B6B", "#4ECDC4", "#FFD93D", "#6C5CE7", "#A8E6CF",
  "#FF8C42", "#45B7D1", "#F7DC6F", "#BB8FCE",
];

export default function LPChart({ players }: { players: PlayerData[] }) {
  const [snapshots, setSnapshots] = useState<LPSnapshot[]>([]);
  const [visible, setVisible] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetch("/api/lp-history")
      .then((r) => r.json())
      .then((data: LPSnapshot[]) => {
        const step = Math.max(1, Math.floor(data.length / 14));
        const reduced = data.filter((_, i) => i % step === 0 || i === 0 || i === data.length - 1);
        setSnapshots(reduced);
      })
      .catch(() => {});
    const interval = setInterval(() => {
      fetch("/api/lp-history")
        .then((r) => r.json())
        .then((data: LPSnapshot[]) => {
          const step = Math.max(1, Math.floor(data.length / 14));
          const reduced = data.filter((_, i) => i % step === 0 || i === 0 || i === data.length - 1);
          setSnapshots((prev) => (reduced.length >= prev.length ? reduced : prev));
        })
        .catch(() => {});
    }, 60_000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const names = snapshots[0]?.players.map((p) => p.gameName) || [];
    if (names.length > 0) {
      setVisible((prev) => {
        const next = { ...prev };
        names.forEach((n) => { if (!(n in next)) next[n] = true; });
        return next;
      });
    }
  }, [snapshots]);

  const playerNames = useMemo(
    () => snapshots[0]?.players.map((p) => p.gameName) || [],
    [snapshots]
  );

  const leader = playerNames[0] || "";

  if (snapshots.length < 2) {
    return (
      <div className="w-full">
        <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-8 text-center">
          <p className="text-zinc-500 text-sm">El gráfico necesita al menos 2 actualizaciones.</p>
        </div>
      </div>
    );
  }

  const transformed = snapshots.map((s) => {
    const point: Record<string, number | string> = {
      time: new Date(s.timestamp).toLocaleTimeString("es-ES", {
        hour: "2-digit", minute: "2-digit",
      }),
    };
    s.players.forEach((p) => {
      if (visible[p.gameName]) point[p.gameName] = p.numericLP;
    });
    return point;
  });

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-zinc-900 border border-white/10 rounded-xl p-3 shadow-2xl">
        <p className="text-xs text-zinc-500 mb-2">{label}</p>
        {payload.map((entry: any, i: number) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: entry.color }} />
            <span className="text-zinc-300 font-medium">{entry.name}</span>
            <span className="text-white font-semibold tabular-nums ml-auto">
              {(entry.value as number).toFixed(0)} LP
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="w-full mt-2">
      <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h3
            className="text-xs font-semibold text-zinc-400 uppercase tracking-[0.15em]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Progresión de LP
          </h3>
          <div className="flex gap-1.5 flex-wrap">
            {playerNames.map((name, i) => (
              <button
                key={name}
                onClick={() => setVisible((v) => ({ ...v, [name]: !v[name] }))}
                className="text-[10px] px-2.5 py-0.5 rounded-full border transition-all cursor-pointer"
                style={{
                  borderColor: visible[name] ? (PLAYER_COLORS[i] || "#888") : "rgba(255,255,255,0.08)",
                  color: visible[name] ? (PLAYER_COLORS[i] || "#888") : "#52525b",
                  opacity: visible[name] ? 1 : 0.45,
                }}
              >
                {name}
              </button>
            ))}
          </div>
        </div>

        <ResponsiveContainer width="100%" height={380}>
          <ComposedChart data={transformed} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id="leaderGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={PLAYER_COLORS[0]} stopOpacity={0.25} />
                <stop offset="100%" stopColor={PLAYER_COLORS[0]} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.04)"
              vertical={false}
            />
            <XAxis
              dataKey="time"
              tick={{ fill: "#52525b", fontSize: 10 }}
              axisLine={{ stroke: "rgba(255,255,255,0.06)" }}
              tickLine={false}
              tickCount={5}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fill: "#52525b", fontSize: 10 }}
              axisLine={{ stroke: "rgba(255,255,255,0.06)" }}
              tickLine={false}
              width={45}
              domain={["dataMin - 80", "dataMax + 80"]}
              tickFormatter={(v: number) => `${((v - 2000) / 10).toFixed(0)}`}
            />
            <Tooltip content={<CustomTooltip />} />

            {visible[leader] && (
              <Area
                type="monotone"
                dataKey={leader}
                fill="url(#leaderGradient)"
                stroke="none"
              />
            )}

            {playerNames.map(
              (name, i) =>
                visible[name] && (
                  <Line
                    key={name}
                    type="monotone"
                    dataKey={name}
                    stroke={PLAYER_COLORS[i] || "#888"}
                    strokeWidth={name === leader ? 2 : 1.2}
                    dot={false}
                    activeDot={{ r: 4, strokeWidth: 0 }}
                    connectNulls
                  />
                )
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
