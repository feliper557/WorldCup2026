export interface Score {
  userId: string;
  displayName: string;
  totalPoints: number;
  totalPredictions: number;
  exactScores: number;
  correctWinners: number;
  rank: number;
}

export interface Participant extends Score {
  joinedAtUtc?: string;
  lastActiveAtUtc?: string;
}
