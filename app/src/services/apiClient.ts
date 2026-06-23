import type { Match, Prediction, PredictionRequest, Score, Raffle, RaffleCreateRequest, RaffleJoinRequest } from '../types';
import type { AdminUser, InvitationRequest, Invitation, ResetPasswordRequest } from '../types/admin';
import { getStoredToken } from './auth';

// Determinar la URL base del API
// Por defecto usar /api (Azure Static Web Apps proxy)
// Solo usar localhost en desarrollo local
export const getApiBase = () => {
  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';

  // En localhost/127.0.0.1 → emulador Azure Functions
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:7071/api';
  }

  // En todo lo demás (producción/Azure) → usar /api
  return '/api';
};

const BASE = getApiBase();

// Helper para request
async function request<T>(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'GET',
  body?: unknown
): Promise<T> {
  const url = `${BASE}${endpoint}`;
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  // Agregar token JWT si existe (para endpoints autenticados)
  // NOTA: Static Web Apps reserva el header 'Authorization' para su propio sistema
  // de auth built-in, así que mandamos el JWT en un header custom que SWA no toca.
  const token = getStoredToken();
  if (token) {
    (options.headers as Record<string, string>)['X-Auth-Token'] = token;
  }

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);

  if (response.status === 401) {
    // Token expirado o inválido — limpiar sesión y redirigir a login
    localStorage.removeItem('jwtToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('user');
    window.location.href = '/login';
    throw new Error('Sesión expirada. Inicia sesión nuevamente.');
  }

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

function patch<T>(endpoint: string, body: unknown): Promise<T> {
  return request<T>(endpoint, 'PATCH', body);
}

// Endpoints de Matches
export const getMatches = async (): Promise<Match[]> => {
  const data = await get<any[]>('/matches');
  return data.map((item) => ({
    id: item.Id || item.id,
    tournamentId: item.TournamentId || item.tournamentId || '',
    homeTeam: item.HomeTeam || item.homeTeam,
    awayTeam: item.AwayTeam || item.awayTeam,
    kickoffAtUtc: item.MatchDate || item.kickoffAtUtc,
    stage: item.Stage || item.stage,
    status: item.Status || item.status,
    homeScoreFinal: item.HomeScore ?? item.homeScoreFinal ?? null,
    awayScoreFinal: item.AwayScore ?? item.awayScoreFinal ?? null,
  }));
};

// Endpoints de Predictions
const mapPrediction = (item: any): Prediction => ({
  id: item.Id || item.id,
  userId: item.UserId || item.userId,
  matchId: item.MatchId || item.matchId,
  homeScorePred: item.HomeScorePred ?? item.homeScorePred ?? item.PredictedHomeScore ?? item.predictedHomeScore ?? 0,
  awayScorePred: item.AwayScorePred ?? item.awayScorePred ?? item.PredictedAwayScore ?? item.predictedAwayScore ?? 0,
  createdAtUtc: item.CreatedAtUtc || item.createdAtUtc || item.CreatedAt || item.createdAt || '',
  updatedAtUtc: item.UpdatedAt || item.updatedAt || '',
  lockedAt: item.LockedAt || item.lockedAt || null,
  pointsAwarded: item.PointsEarned ?? item.pointsEarned ?? item.PointsAwarded ?? item.pointsAwarded ?? null,
});

export const upsertPrediction = async (body: PredictionRequest): Promise<Prediction> => {
  const data = await post<any>('/predictions', body);
  return mapPrediction(data);
};

export const getMyPredictions = async (): Promise<Prediction[]> => {
  const data = await get<any[]>('/predictions/me');
  return data.map(mapPrediction);
};

export const getPredictionsByMatch = (matchId: string): Promise<Prediction[]> =>
  get(`/predictions/match/${matchId}`);

export interface MatchPredictionEntry {
  displayName: string;
  predictedHome: number;
  predictedAway: number;
  pointsEarned: number;
  diff: number;
}

export const getMatchPredictions = (matchId: string): Promise<MatchPredictionEntry[]> =>
  get(`/predictions/match/${matchId}`);

export interface UserPredictionResult {
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  stage: string;
  matchDate: string;
  homeScore: number;
  awayScore: number;
  predictedHome: number;
  predictedAway: number;
  pointsEarned: number;
}

export const getUserPredictions = async (userId: string): Promise<UserPredictionResult[]> => {
  const data = await get<any[]>(`/predictions/user/${encodeURIComponent(userId)}`);
  return data.map((item) => ({
    matchId:       item.matchId       ?? item.MatchId       ?? '',
    homeTeam:      item.homeTeam      ?? item.HomeTeam      ?? '',
    awayTeam:      item.awayTeam      ?? item.AwayTeam      ?? '',
    stage:         item.stage         ?? item.Stage         ?? '',
    matchDate:     item.matchDate     ?? item.MatchDate     ?? '',
    homeScore:     item.homeScore     ?? item.HomeScore     ?? 0,
    awayScore:     item.awayScore     ?? item.AwayScore     ?? 0,
    predictedHome: item.predictedHome ?? item.PredictedHome ?? 0,
    predictedAway: item.predictedAway ?? item.PredictedAway ?? 0,
    pointsEarned:  item.pointsEarned  ?? item.PointsEarned  ?? 0,
  }));
};

// Endpoints de Ranking
export const getRanking = async (): Promise<Score[]> => {
  const data = await get<any[]>('/ranking');
  return data.map((item) => ({
    userId: item.Id || item.id || item.UserId || item.userId,
    displayName: item.DisplayName || item.displayName,
    totalPoints: item.TotalPoints ?? item.totalPoints ?? 0,
    totalPredictions: item.TotalPredictions ?? item.totalPredictions ?? 0,
    exactScores: item.ExactScores ?? item.exactScores ?? 0,
    correctWinners: item.CorrectWinners ?? item.correctWinners ?? 0,
    championTeam: item.ChampionTeam ?? item.championTeam ?? null,
    championFlag: item.ChampionFlag ?? item.championFlag ?? null,
    rank: item.Rank ?? item.rank ?? 0,
  }));
};

// Endpoints de Participantes (usar getRanking si son los mismos datos)
export const getParticipants = (): Promise<Score[]> => getRanking();

// Endpoints de Rifas
const mapRaffle = (r: any): Raffle => ({
  id:               r.Id              ?? r.id              ?? '',
  title:            r.Title           ?? r.title           ?? '',
  description:      r.Description     ?? r.description     ?? '',
  prize:            r.Prize           ?? r.prize           ?? '',
  status:           (r.Status ?? r.status ?? 'open').toUpperCase() as Raffle['status'],
  maxParticipants:  r.MaxParticipants ?? r.maxParticipants ?? null,
  participantCount: r.ParticipantCount ?? r.participantCount ?? (r.Participants?.length ?? r.participants?.length ?? 0),
  createdAtUtc:     r.CreatedAtUtc    ?? r.createdAtUtc    ?? '',
  drawAtUtc:        r.DrawAtUtc       ?? r.drawAtUtc       ?? '',
  winnerId:         r.WinnerId        ?? r.winnerId        ?? null,
  winnerName:       r.WinnerName      ?? r.winnerName      ?? null,
  participants:     (r.Participants   ?? r.participants    ?? []).map((p: any) => ({
    userId:      p.UserId      ?? p.userId      ?? '',
    displayName: p.DisplayName ?? p.displayName ?? '',
    joinedAtUtc: p.JoinedAtUtc ?? p.joinedAtUtc ?? '',
    tickets:     p.Tickets     ?? p.tickets     ?? 1,
  })),
});

export const getRaffles = async (): Promise<Raffle[]> => {
  const data = await get<any[]>('/raffles');
  return data.map(mapRaffle);
};

export const getRaffleById = async (raffleId: string): Promise<Raffle> => {
  const data = await get<any>(`/raffles/${raffleId}`);
  return mapRaffle(data);
};

export const createRaffle = (body: RaffleCreateRequest): Promise<Raffle> =>
  post('/mgmt/raffles', body);

export const joinRaffle = (body: RaffleJoinRequest): Promise<Raffle> =>
  post(`/raffles/${body.raffleId}/join`, { tickets: body.tickets });

export const drawRaffle = (raffleId: string): Promise<Raffle> =>
  post(`/raffles/${raffleId}/draw`, {});

export const addRaffleParticipant = (raffleId: string, userId: string): Promise<Raffle> =>
  post(`/mgmt/raffles/${raffleId}/participants`, { userId });

export const removeRaffleParticipant = (raffleId: string, userId: string): Promise<{ success: boolean }> =>
  request(`/mgmt/raffles/${raffleId}/participants/${encodeURIComponent(userId)}`, 'DELETE');

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

export const getUsers = (): Promise<AdminUser[]> => get('/mgmt/users');

export const getInvitations = (): Promise<{ invitations: Invitation[]; total: number }> =>
  get('/mgmt/invitations');

export const sendInvitation = (body: InvitationRequest): Promise<Invitation> =>
  post('/mgmt/invitations', body);

export const resendInvitation = (invitationId: string, channel: 'email' | 'whatsapp'): Promise<{ success: boolean; newLink: string; newExpiresAt: string }> =>
  post(`/mgmt/invitations/${invitationId}/resend?channel=${channel}`, {});

export const resetUserPassword = (userId: string, body: ResetPasswordRequest): Promise<{ success: boolean }> =>
  post(`/mgmt/users/${userId}/reset-password`, body);

export const toggleUserActive = (userId: string, isActive: boolean): Promise<{ success: boolean; message?: string }> =>
  patch(`/mgmt/users/${userId}/status`, { status: isActive ? 'active' : 'inactive' });

export const recalculatePoints = (userId?: string): Promise<{ message: string; matchesProcessed: number; predictionsUpdated: number }> =>
  post(`/mgmt/recalculate-points${userId ? `?userId=${encodeURIComponent(userId)}` : ''}`, {});

export interface ReminderUserDetail {
  userId: string;
  email: string;
  displayName: string;
  missingCount: number;
  notified: boolean;
}

export interface SendRemindersResponse {
  matchesToday: number;
  activeUsers: number;
  usersNotified: number;
  usersAlreadyComplete: number;
  details: ReminderUserDetail[];
  message: string;
}

export const sendReminders = (date: string): Promise<SendRemindersResponse> =>
  post('/mgmt/send-reminders', { date });

export interface ChampionAwardDetail {
  userId: string;
  email: string;
  displayName: string;
  predictedTeam: string;
  isCorrect: boolean;
  pointsAwarded: number;
}

export interface ApplyChampionResponse {
  champion: string;
  totalPredictions: number;
  winners: number;
  details: ChampionAwardDetail[];
  message: string;
}

export const applyChampion = (champion: string): Promise<ApplyChampionResponse> =>
  post('/mgmt/apply-champion', { champion });

export const sendPasswordResetLink = (userId: string): Promise<{ success: boolean; message: string; link: string; expiresInMinutes: number }> =>
  post(`/mgmt/users/${userId}/send-reset-link`, {});

export const resetPasswordWithToken = (token: string, newPassword: string): Promise<{ success: boolean; message: string }> =>
  post('/auth/reset-password-with-token', { token, newPassword });

export const forgotPassword = (email: string): Promise<{ success: boolean; message: string }> =>
  post('/auth/forgot-password', { email });

// Endpoints de Perfil
export interface UpdateProfileBody {
  displayName?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
}

export const updateProfile = (body: UpdateProfileBody): Promise<any> =>
  request('/auth/profile', 'PUT', body);

export const changePassword = (body: { currentPassword: string; newPassword: string }): Promise<{ success: boolean; message: string }> =>
  post('/auth/change-password', body);
