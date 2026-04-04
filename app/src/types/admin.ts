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
  displayName: string;
  status: 'pending' | 'accepted' | 'rejected';
  sentAtUtc: string;
  acceptedAtUtc?: string;
  invitationCode: string;
}

export interface ResetPasswordRequest {
  userId: string;
  newPassword: string;
}
