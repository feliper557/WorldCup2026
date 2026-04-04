import type { Match, Prediction, Score, Raffle } from '../types';
import type { AdminUser, Invitation } from '../types/admin';

// Mock data para desarrollo
export const MOCK_MATCHES: Match[] = [
  {
    id: 'match-1',
    tournamentId: 'world-2026',
    homeTeam: 'Argentina',
    awayTeam: 'Francia',
    kickoffAtUtc: new Date(Date.now() + 86400000).toISOString(), // mañana
    stage: 'Grupos',
    status: 'SCHEDULED',
    homeScoreFinal: null,
    awayScoreFinal: null,
  },
  {
    id: 'match-2',
    tournamentId: 'world-2026',
    homeTeam: 'Brasil',
    awayTeam: 'Alemania',
    kickoffAtUtc: new Date(Date.now() + 172800000).toISOString(), // en 2 días
    stage: 'Grupos',
    status: 'SCHEDULED',
    homeScoreFinal: null,
    awayScoreFinal: null,
  },
  {
    id: 'match-3',
    tournamentId: 'world-2026',
    homeTeam: 'España',
    awayTeam: 'Inglaterra',
    kickoffAtUtc: new Date(Date.now() + 3600000).toISOString(), // en 1 hora
    stage: 'Grupos',
    status: 'LIVE',
    homeScoreFinal: 2,
    awayScoreFinal: 1,
  },
  {
    id: 'match-4',
    tournamentId: 'world-2026',
    homeTeam: 'Países Bajos',
    awayTeam: 'Portugal',
    kickoffAtUtc: new Date(Date.now() - 86400000).toISOString(), // ayer
    stage: 'Grupos',
    status: 'FINISHED',
    homeScoreFinal: 3,
    awayScoreFinal: 2,
  },
  {
    id: 'match-5',
    tournamentId: 'world-2026',
    homeTeam: 'Italia',
    awayTeam: 'Bélgica',
    kickoffAtUtc: new Date(Date.now() - 172800000).toISOString(), // hace 2 días
    stage: 'Grupos',
    status: 'FINISHED',
    homeScoreFinal: 1,
    awayScoreFinal: 1,
  },
];

export const MOCK_PREDICTIONS: Prediction[] = [
  {
    id: 'pred-1',
    userId: 'dev-user-123',
    matchId: 'match-1',
    homeScorePred: 2,
    awayScorePred: 1,
    createdAtUtc: new Date().toISOString(),
    updatedAtUtc: new Date().toISOString(),
    lockedAt: null,
    pointsAwarded: null,
  },
  {
    id: 'pred-2',
    userId: 'dev-user-123',
    matchId: 'match-4',
    homeScorePred: 2,
    awayScorePred: 2,
    createdAtUtc: new Date().toISOString(),
    updatedAtUtc: new Date().toISOString(),
    lockedAt: new Date(Date.now() - 86400000).toISOString(),
    pointsAwarded: 1, // acertó el ganador pero no el marcador exacto
  },
  {
    id: 'pred-3',
    userId: 'dev-user-123',
    matchId: 'match-5',
    homeScorePred: 1,
    awayScorePred: 1,
    createdAtUtc: new Date().toISOString(),
    updatedAtUtc: new Date().toISOString(),
    lockedAt: new Date(Date.now() - 172800000).toISOString(),
    pointsAwarded: 3, // marcador exacto
  },
];

export const MOCK_RANKING: Score[] = [
  {
    userId: 'user-alpha',
    displayName: 'Polla Alpha',
    totalPoints: 245,
    totalPredictions: 18,
    exactScores: 5,
    correctWinners: 12,
    rank: 1,
  },
  {
    userId: 'user-beta',
    displayName: 'Polla Beta',
    totalPoints: 238,
    totalPredictions: 18,
    exactScores: 4,
    correctWinners: 14,
    rank: 2,
  },
  {
    userId: 'dev-user-123',
    displayName: 'DevUser',
    totalPoints: 224,
    totalPredictions: 18,
    exactScores: 0,
    correctWinners: 0,
    rank: 3,
  },
  {
    userId: 'user-gamma',
    displayName: 'Polla Gamma',
    totalPoints: 210,
    totalPredictions: 18,
    exactScores: 3,
    correctWinners: 11,
    rank: 4,
  },
  {
    userId: 'user-delta',
    displayName: 'Polla Delta',
    totalPoints: 195,
    totalPredictions: 17,
    exactScores: 2,
    correctWinners: 8,
    rank: 5,
  },
  {
    userId: 'user-episolon',
    displayName: 'Polla Episolon',
    totalPoints: 180,
    totalPredictions: 15,
    exactScores: 1,
    correctWinners: 10,
    rank: 6,
  },
];

export const MOCK_RAFFLES: Raffle[] = [
  {
    id: 'raffle-1',
    title: 'Camiseta de Selección Colombia 2026',
    description: 'Camiseta oficial firmada por la selección',
    prize: 'Camiseta Selección Colombia 2026 Firmada',
    status: 'OPEN',
    maxParticipants: null,
    participantCount: 12,
    createdAtUtc: new Date(Date.now() - 86400000).toISOString(),
    drawAtUtc: new Date(Date.now() + 259200000).toISOString(), // en 3 días
    winnerId: null,
    winnerName: null,
    participants: [
      {
        userId: 'dev-user-123',
        displayName: 'DevUser',
        joinedAtUtc: new Date(Date.now() - 3600000).toISOString(),
        tickets: 5,
      },
      {
        userId: 'user-alpha',
        displayName: 'Polla Alpha',
        joinedAtUtc: new Date(Date.now() - 7200000).toISOString(),
        tickets: 3,
      },
      {
        userId: 'user-beta',
        displayName: 'Polla Beta',
        joinedAtUtc: new Date(Date.now() - 10800000).toISOString(),
        tickets: 4,
      },
    ],
  },
  {
    id: 'raffle-2',
    title: 'Balón Adidas Oficial World Cup 2026',
    description: 'Balón oficial de los partidos del Mundial 2026',
    prize: 'Balón Adidas Oficial World Cup 2026',
    status: 'OPEN',
    maxParticipants: null,
    participantCount: 8,
    createdAtUtc: new Date(Date.now() - 172800000).toISOString(),
    drawAtUtc: new Date(Date.now() + 432000000).toISOString(), // en 5 días
    winnerId: null,
    winnerName: null,
    participants: [
      {
        userId: 'user-gamma',
        displayName: 'Polla Gamma',
        joinedAtUtc: new Date(Date.now() - 86400000).toISOString(),
        tickets: 2,
      },
      {
        userId: 'user-delta',
        displayName: 'Polla Delta',
        joinedAtUtc: new Date(Date.now() - 129600000).toISOString(),
        tickets: 6,
      },
    ],
  },
  {
    id: 'raffle-3',
    title: 'Entrada VIP Final Mundial 2026',
    description: 'Entrada con acceso VIP a la final del torneo',
    prize: 'Entrada VIP Final + Hospedaje 3 noches',
    status: 'COMPLETED',
    maxParticipants: 50,
    participantCount: 47,
    createdAtUtc: new Date(Date.now() - 604800000).toISOString(), // hace 1 semana
    drawAtUtc: new Date(Date.now() - 259200000).toISOString(), // hace 3 días
    winnerId: 'user-alpha',
    winnerName: 'Polla Alpha',
    participants: [],
  },
];

export const MOCK_USERS: AdminUser[] = [
  {
    userId: 'dev-user-123',
    displayName: 'DevUser',
    email: 'dev@francachela.com',
    identityProvider: 'email',
    joinedAtUtc: new Date(Date.now() - 2592000000).toISOString(), // hace 30 días
    lastActiveAtUtc: new Date(Date.now() - 3600000).toISOString(), // hace 1 hora
    totalPoints: 224,
    totalPredictions: 18,
    isActive: true,
  },
  {
    userId: 'user-alpha',
    displayName: 'Polla Alpha',
    email: 'alpha@github.com',
    identityProvider: 'github',
    joinedAtUtc: new Date(Date.now() - 5184000000).toISOString(), // hace 60 días
    lastActiveAtUtc: new Date(Date.now() - 7200000).toISOString(), // hace 2 horas
    totalPoints: 245,
    totalPredictions: 18,
    isActive: true,
  },
  {
    userId: 'user-beta',
    displayName: 'Polla Beta',
    email: 'beta@example.com',
    identityProvider: 'email',
    joinedAtUtc: new Date(Date.now() - 4320000000).toISOString(), // hace 50 días
    lastActiveAtUtc: new Date(Date.now() - 86400000).toISOString(), // hace 1 día
    totalPoints: 238,
    totalPredictions: 18,
    isActive: true,
  },
  {
    userId: 'user-gamma',
    displayName: 'Polla Gamma',
    email: 'gamma@github.com',
    identityProvider: 'github',
    joinedAtUtc: new Date(Date.now() - 3456000000).toISOString(), // hace 40 días
    lastActiveAtUtc: new Date(Date.now() - 172800000).toISOString(), // hace 2 días
    totalPoints: 210,
    totalPredictions: 18,
    isActive: true,
  },
  {
    userId: 'user-delta',
    displayName: 'Polla Delta',
    email: 'delta@example.com',
    identityProvider: 'email',
    joinedAtUtc: new Date(Date.now() - 2592000000).toISOString(), // hace 30 días
    lastActiveAtUtc: new Date(Date.now() - 604800000).toISOString(), // hace 1 semana
    totalPoints: 195,
    totalPredictions: 17,
    isActive: false, // usuario inactivo
  },
  {
    userId: 'user-episolon',
    displayName: 'Polla Episolon',
    email: 'episolon@github.com',
    identityProvider: 'github',
    joinedAtUtc: new Date(Date.now() - 1728000000).toISOString(), // hace 20 días
    lastActiveAtUtc: new Date().toISOString(), // hace poco
    totalPoints: 180,
    totalPredictions: 15,
    isActive: true,
  },
];

export const MOCK_INVITATIONS: Invitation[] = [
  {
    id: 'inv-1',
    email: 'newuser@example.com',
    displayName: 'Nuevo Usuario',
    status: 'pending',
    sentAtUtc: new Date(Date.now() - 86400000).toISOString(), // hace 1 día
    invitationCode: 'ABC123XYZ',
  },
  {
    id: 'inv-2',
    email: 'accepted@example.com',
    displayName: 'Usuario Aceptado',
    status: 'accepted',
    sentAtUtc: new Date(Date.now() - 172800000).toISOString(), // hace 2 días
    acceptedAtUtc: new Date(Date.now() - 86400000).toISOString(), // hace 1 día
    invitationCode: 'DEF456UVW',
  },
  {
    id: 'inv-3',
    email: 'rejected@example.com',
    displayName: 'Usuario Rechazado',
    status: 'rejected',
    sentAtUtc: new Date(Date.now() - 604800000).toISOString(), // hace 1 semana
    invitationCode: 'GHI789STU',
  },
];
