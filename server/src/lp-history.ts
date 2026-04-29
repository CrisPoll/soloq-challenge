export interface LPSnapshot {
  timestamp: number;
  players: {
    gameName: string;
    tier: string;
    rank: string;
    lp: number;
    numericLP: number;
  }[];
}
