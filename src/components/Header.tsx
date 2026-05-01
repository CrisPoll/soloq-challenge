import { useState, useEffect } from "react";

function Countdown() {
  const [text, setText] = useState("");
  useEffect(() => {
    function update() {
      const now = Date.now();
      const next = Math.ceil(now / (30 * 60 * 1000)) * (30 * 60 * 1000);
      const diff = next - now;
      const m = Math.floor(diff / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setText(`${m}m ${s.toString().padStart(2, "0")}s`);
    }
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);
  return <span className="font-mono text-xs text-zinc-400 tabular-nums">{text}</span>;
}

export default function Header({ onRefresh }: { onRefresh: () => void }) {
  return (
    <header className="w-full border-b border-white/5">
      <div className="py-3 flex items-center justify-between gap-4">
        <span
          className="text-xs text-zinc-600 uppercase tracking-[0.2em]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          SoloQ Challenge
        </span>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs">
            <span className="relative flex h-2 w-2" aria-hidden="true">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-win opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-win" />
            </span>
            <span className="text-zinc-500">Última actualización</span>
            <Countdown />
          </div>
          <button
            onClick={onRefresh}
            className="focus-ring px-4 py-1.5 text-xs font-semibold text-accent bg-accent/5 border border-accent/20 rounded-full hover:bg-accent/10 transition-colors cursor-pointer uppercase tracking-wider"
            aria-label="Recargar datos"
          >
            Refresh
          </button>
        </div>
      </div>
    </header>
  );
}
