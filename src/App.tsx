import { useState } from "react";
import Header from "./components/Header";
import RankingTable from "./components/RankingTable";
import LPChart from "./components/LPChart";
import PlayerDetail from "./components/PlayerDetail";
import GlobalStats from "./components/GlobalStats";
import { usePlayers } from "./hooks/usePlayers";
import type { PlayerData } from "./types";

export default function App() {
  const { players, loading, error, refresh } = usePlayers();
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerData | null>(null);

  return (
    <div className="min-h-screen w-full flex flex-col items-center">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-accent/3 rounded-full blur-[180px]" />
      </div>

      <div className="relative z-10 max-w-[1200px] w-full px-6">
        <Header onRefresh={refresh} />

        <main className="py-8 pb-20 space-y-12">
          <div className="text-center">
            <h1
              className="text-4xl sm:text-5xl font-bold uppercase tracking-[0.12em] leading-none"
              style={{ fontFamily: "var(--font-display)" }}
            >
              <span className="text-white">AMORFOS</span>{" "}
              <span className="text-accent">TEAM</span>
            </h1>
            <p
              className="text-[10px] tracking-[0.5em] text-zinc-500 mt-2 uppercase"
              style={{ fontFamily: "var(--font-display)" }}
            >
              SoloQ Challenge · LAS
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] items-start gap-6 w-full">
            <div className="flex-1 min-w-0">
              <RankingTable
                players={players}
                loading={loading}
                onPlayerClick={setSelectedPlayer}
              />
            </div>

            <div className="lg:sticky lg:top-6">
              <GlobalStats players={players} />
            </div>
          </div>

          <LPChart players={players} />

          {error && (
            <p className="text-sm text-red-400 bg-red-400/5 border border-red-400/10 px-4 py-2 rounded-lg inline-block">
              {error}
            </p>
          )}
        </main>

        <footer className="text-center py-6 text-[10px] text-zinc-600 border-t border-white/5">
          AMORFOS TEAM · SoloQ Challenge LAS · Datos vía RIOT API · Hecho por: Koktei
        </footer>
      </div>

      {selectedPlayer && (
        <PlayerDetail
          player={selectedPlayer}
          onClose={() => setSelectedPlayer(null)}
        />
      )}
    </div>
  );
}
