export interface Prediction {
  id: string;
  userId: string;
  matchId: string;
  homeScorePred: number;
  awayScorePred: number;
  createdAtUtc: string;
  updatedAtUtc: string;
  lockedAt: string | null;
  pointsAwarded: number | null;
}

export interface PredictionRequest {
  matchId: string;
  home: number;
  away: number;
}
