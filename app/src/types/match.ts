export type MatchStatus = 'SCHEDULED' | 'LIVE' | 'FINISHED';

export interface Match {
  id: string;
  tournamentId: string;
  homeTeam: string;
  awayTeam: string;
  kickoffAtUtc: string; // ISO 8601
  stage: string;
  status: MatchStatus;
  homeScoreFinal: number | null;
  awayScoreFinal: number | null;
}
