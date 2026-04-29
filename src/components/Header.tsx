import { useState, useEffect } from "react";

function Countdown() {
  const [text, setText] = useState("");
  useEffect(() => {
    function update() {
      const now = Date.now();
      const next = Math.ceil(now / (10 * 60 * 1000)) * (10 * 60 * 1000);
      const diff = next - now;
      const m = Math.floor(diff / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setText(`${m}m ${s.toString().padStart(2, "0")}s`);
    }
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);
  return <span className="font-mono text-xs text-zinc-500 tabular-nums">{text}</span>;
}

export default function Header({ onRefresh }: { onRefresh: () => void }) {
  return (
    <header className="w-full border-b border-white/5">
      <div className="py-3 flex items-center justify-end gap-4">
        <div className="flex items-center gap-2 text-xs">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-win opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-win" />
          </span>
          <span className="text-zinc-500">Última actualización</span>
          <Countdown />
        </div>
        <button
          onClick={onRefresh}
          className="px-3 py-1 text-[10px] font-semibold text-accent bg-accent/5 border border-accent/20 rounded-full hover:bg-accent/10 transition-colors cursor-pointer uppercase tracking-wider"
        >
          Refresh
        </button>
      </div>
    </header>
  );
}
