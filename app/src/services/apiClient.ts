import type { Match, Prediction, PredictionRequest, Score, Raffle, RaffleCreateRequest, RaffleJoinRequest } from '../types';
import type { AdminUser, InvitationRequest, Invitation, ResetPasswordRequest } from '../types/admin';

const BASE = import.meta.env.VITE_API_URL ?? (import.meta.env.DEV ? 'http://localhost:7071/api' : '/api');

// Helper para request
async function request<T>(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  body?: unknown
): Promise<T> {
  const url = `${BASE}${endpoint}`;
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API Error: ${response.status} - ${error}`);
  }

  return response.json();
}

function get<T>(endpoint: string): Promise<T> {
  return request<T>(endpoint, 'GET');
}

function post<T>(endpoint: string, body: unknown): Promise<T> {
  return request<T>(endpoint, 'POST', body);
}

// Endpoints de Matches
export const getMatches = (): Promise<Match[]> => get('/matches');

// Endpoints de Predictions
export const upsertPrediction = (body: PredictionRequest): Promise<Prediction> =>
  post('/predictions', body);

export const getMyPredictions = (): Promise<Prediction[]> => get('/predictions/me');

export const getPredictionsByMatch = (matchId: string): Promise<Prediction[]> =>
  get(`/predictions/match/${matchId}`);

// Endpoints de Ranking
export const getRanking = (): Promise<Score[]> => get('/ranking');

// Endpoints de Participantes (usar getRanking si son los mismos datos)
export const getParticipants = (): Promise<Score[]> => get('/ranking');

// Endpoints de Rifas
export const getRaffles = (): Promise<Raffle[]> => get('/raffles');

export const getRaffleById = (raffleId: string): Promise<Raffle> => get(`/raffles/${raffleId}`);

export const createRaffle = (body: RaffleCreateRequest): Promise<Raffle> =>
  post('/raffles', body);

export const joinRaffle = (body: RaffleJoinRequest): Promise<Raffle> =>
  post(`/raffles/${body.raffleId}/join`, { tickets: body.tickets });

export const drawRaffle = (raffleId: string): Promise<Raffle> =>
  post(`/raffles/${raffleId}/draw`, {});

// Endpoints de Admin
export interface SyncOptions {
  competition: 'laliga' | 'worldcup';
  dateFrom?: string;  // YYYY-MM-DD
  dateTo?: string;    // YYYY-MM-DD
}

export const syncMatches = (options: SyncOptions): Promise<{ success: boolean; message: string; matchesCount: number }> => {
  const params = new URLSearchParams({ competition: options.competition });
  if (options.dateFrom) params.append('dateFrom', options.dateFrom);
  if (options.dateTo) params.append('dateTo', options.dateTo);
  return post(`/sync-matches?${params.toString()}`, {});
};

export const syncResults = (): Promise<{ message: string; updatedCount: number }> =>
  get('/sync-results');

export const getUsers = (): Promise<AdminUser[]> => get('/admin/users');

export const sendInvitation = (body: InvitationRequest): Promise<Invitation> =>
  post('/admin/invitations', body);

export const resetUserPassword = (userId: string, body: ResetPasswordRequest): Promise<{ success: boolean }> =>
  post(`/admin/users/${userId}/reset-password`, body);

export const toggleUserActive = (userId: string, isActive: boolean): Promise<AdminUser> =>
  post(`/admin/users/${userId}`, { isActive });
