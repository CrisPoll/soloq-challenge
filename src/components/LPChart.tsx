import { useEffect, useState, useMemo } from "react";
import {
  Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Area, ComposedChart,
} from "recharts";
import type { LPSnapshot, PlayerData } from "../types";
import { PLAYER_COLORS } from "../constants";

const CUTOFF = new Date("2026-04-28T00:00:00-04:00").getTime();

function numericToRank(n: number): string {
  if (n >= 3200) return `C ${n - 3200}LP`;
  if (n >= 2800) return `GM ${n - 2800}LP`;
  if (n >= 2400) return `M ${n - 2400}LP`;
  if (n >= 2100) return `D1 ${n - 2100}LP`;
  if (n >= 1900) return `D2 ${n - 1900}LP`;
  if (n >= 1700) return `D3 ${n - 1700}LP`;
  if (n >= 1600) return `D4 ${n - 1600}LP`;
  if (n >= 1500) return `E1 ${n - 1500}LP`;
  if (n >= 1400) return `E2 ${n - 1400}LP`;
  if (n >= 1300) return `E3 ${n - 1300}LP`;
  if (n >= 1200) return `E4 ${n - 1200}LP`;
  if (n >= 1100) return `P1 ${n - 1100}LP`;
  if (n >= 1000) return `P2 ${n - 1000}LP`;
  if (n >= 900)  return `P3 ${n - 900}LP`;
  if (n >= 800)  return `P4 ${n - 800}LP`;
  if (n >= 700)  return `G1 ${n - 700}LP`;
  if (n >= 600)  return `G2 ${n - 600}LP`;
  if (n >= 500)  return `G3 ${n - 500}LP`;
  if (n >= 400)  return `G4 ${n - 400}LP`;
  if (n >= 350)  return `S1 ${n - 350}LP`;
  if (n >= 300)  return `S2 ${n - 300}LP`;
  if (n >= 250)  return `S3 ${n - 250}LP`;
  if (n >= 200)  return `S4 ${n - 200}LP`;
  return `B ${n}LP`;
}

export default function LPChart({ players }: { players: PlayerData[] }) {
  const [snapshots, setSnapshots] = useState<LPSnapshot[]>([]);
  const [visible, setVisible] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetch("/api/lp-history")
      .then((r) => r.json())
      .then((data: LPSnapshot[]) => {
        const filtered = data.filter((s) => s.timestamp >= CUTOFF);
        const step = Math.max(1, Math.floor(filtered.length / 14));
        const reduced = filtered.filter((_, i) => i % step === 0 || i === 0 || i === filtered.length - 1);
        setSnapshots(reduced);
      })
      .catch(() => {});
    const interval = setInterval(() => {
      fetch("/api/lp-history")
        .then((r) => r.json())
        .then((data: LPSnapshot[]) => {
          const filtered = data.filter((s) => s.timestamp >= CUTOFF);
          const step = Math.max(1, Math.floor(filtered.length / 14));
          const reduced = filtered.filter((_, i) => i % step === 0 || i === 0 || i === filtered.length - 1);
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

  if (snapshots.length < 5) {
    return (
      <div className="w-full">
        <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-10 text-center">
          <p className="text-zinc-500 text-sm" style={{ fontFamily: "var(--font-display)" }}>
            Acumulando datos...
          </p>
          <p className="text-zinc-500 text-xs mt-1">
            {snapshots.length} de 5 snapshots necesarios para mostrar el gráfico
          </p>
        </div>
      </div>
    );
  }

  const transformed = snapshots.map((s) => {
    const d = new Date(s.timestamp);
    const point: Record<string, number | string> = {
      time: `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")} ${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`,
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
              {numericToRank(entry.value as number)}
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="w-full">
      <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-[0.15em]" style={{ fontFamily: "var(--font-display)" }}>
            Progresión de LP · desde 28/04
          </h3>
          <div className="flex gap-1.5 flex-wrap">
            {playerNames.map((name, i) => {
              const color = PLAYER_COLORS[i] || "#888";
              const isActive = visible[name];
              return (
                <button
                  key={name}
                  onClick={() => setVisible((v) => ({ ...v, [name]: !v[name] }))}
                  aria-pressed={isActive}
                  className="focus-ring text-xs px-2.5 py-0.5 rounded-full border transition-all cursor-pointer"
                  style={{
                    borderColor: isActive ? color : "rgba(255,255,255,0.1)",
                    color: isActive ? color : "#71717a",
                    opacity: isActive ? 1 : 0.55,
                  }}
                >
                  {name}
                </button>
              );
            })}
          </div>
        </div>

        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart data={transformed} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
            <defs>
              <linearGradient id="leaderGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={PLAYER_COLORS[0]} stopOpacity={0.25} />
                <stop offset="100%" stopColor={PLAYER_COLORS[0]} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
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
              width={60}
              domain={["dataMin - 100", "dataMax + 100"]}
              tickFormatter={numericToRank}
            />
            <Tooltip content={<CustomTooltip />} />

            {visible[leader] && (
              <Area type="monotone" dataKey={leader} fill="url(#leaderGradient)" stroke="none" />
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
                    dot={{ r: 3, strokeWidth: 0 }}
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
