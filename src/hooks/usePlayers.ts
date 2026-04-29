import { useState, useEffect, useCallback } from "react";
import type { PlayerData } from "../types";

interface PlayersResponse {
  players: PlayerData[];
  lastUpdate: string;
}

export function usePlayers() {
  const [players, setPlayers] = useState<PlayerData[]>([]);
  const [lastUpdate, setLastUpdate] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPlayers = useCallback(async () => {
    try {
      const res = await fetch("/api/players");
      if (!res.ok) throw new Error("Failed to fetch");
      const data: PlayersResponse = await res.json();
      setPlayers(
        data.players.sort((a, b) => b.points - a.points)
      );
      setLastUpdate(data.lastUpdate);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlayers();
    const interval = setInterval(fetchPlayers, 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchPlayers]);

  const refresh = useCallback(async () => {
    setLoading(true);
    await fetch("/api/refresh");
    await new Promise((r) => setTimeout(r, 3000));
    await fetchPlayers();
  }, [fetchPlayers]);

  return { players, lastUpdate, loading, error, refresh };
}
