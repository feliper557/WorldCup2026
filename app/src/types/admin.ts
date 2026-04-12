export type IdentityProvider = 'github' | 'email';

export interface AdminUser {
  userId: string;
  displayName: string;
  email: string;
  identityProvider: IdentityProvider;
  joinedAtUtc: string;
  lastActiveAtUtc: string;
  totalPoints: number;
  totalPredictions: number;
  isActive: boolean;
}

export interface InvitationRequest {
  email: string;
  displayName: string;
  message?: string;
}

export interface Invitation {
  id: string;
  email: string;
  status: 'pending' | 'used' | 'expired';
  createdAtUtc: string;
  expiresAtUtc: string;
  notificationChannel: string;
}

export interface CreateInvitationResponse {
  link: string;
  expiresAt: string;
  invitationCode: string;
}

export interface ResetPasswordRequest {
  userId: string;
  newPassword: string;
}
