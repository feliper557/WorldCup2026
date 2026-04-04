export type RaffleStatus = 'OPEN' | 'DRAWING' | 'COMPLETED';

export interface Raffle {
  id: string;
  title: string;
  description: string;
  prize: string;
  status: RaffleStatus;
  maxParticipants: number | null;
  participantCount: number;
  createdAtUtc: string;
  drawAtUtc: string;
  winnerId: string | null;
  winnerName: string | null;
  participants: RaffleParticipant[];
}

export interface RaffleParticipant {
  userId: string;
  displayName: string;
  joinedAtUtc: string;
  tickets: number; // cantidad de boletas
}

export interface RaffleCreateRequest {
  title: string;
  description: string;
  prize: string;
  maxParticipants?: number | null;
  drawAtUtc: string;
}

export interface RaffleJoinRequest {
  raffleId: string;
  tickets: number;
}
