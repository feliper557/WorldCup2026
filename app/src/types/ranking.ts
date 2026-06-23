export interface Score {
  userId: string;
  displayName: string;
  totalPoints: number;
  totalPredictions: number;
  exactScores: number;
  correctWinners: number;
  championTeam?: string | null;
  championFlag?: string | null;
  rank: number;
}

export interface Participant extends Score {
  joinedAtUtc?: string;
  lastActiveAtUtc?: string;
}
