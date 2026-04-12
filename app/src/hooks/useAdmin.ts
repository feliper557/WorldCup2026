import { useState, useEffect } from 'react';
import { getUsers, getInvitations, sendInvitation, resetUserPassword, toggleUserActive } from '../services/apiClient';
import type { AdminUser, InvitationRequest, Invitation, CreateInvitationResponse } from '../types/admin';

interface UseAdminResult {
  users: AdminUser[];
  invitations: Invitation[];
  loading: boolean;
  error: Error | null;
  fetchUsers: () => Promise<void>;
  sendInvitation: (data: InvitationRequest) => Promise<CreateInvitationResponse>;
  resetPassword: (userId: string, newPassword: string) => Promise<void>;
  toggleActive: (userId: string, isActive: boolean) => Promise<void>;
}

export function useAdmin(): UseAdminResult {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getUsers();
      // API returns { Users: [...], TotalCount: N } with PascalCase fields
      const raw: any[] = Array.isArray(data) ? data : (data as any).Users ?? [];
      const list: AdminUser[] = raw.map((u) => ({
        userId: u.Id ?? u.userId,
        displayName: u.DisplayName ?? u.displayName ?? '',
        email: u.Email ?? u.email ?? '',
        identityProvider: (u.IdentityProvider ?? u.identityProvider ?? 'email') as AdminUser['identityProvider'],
        joinedAtUtc: u.CreatedAt ?? u.joinedAtUtc ?? '',
        lastActiveAtUtc: u.LastLoginAt ?? u.lastActiveAtUtc ?? '',
        totalPoints: u.TotalPoints ?? u.totalPoints ?? 0,
        totalPredictions: u.TotalPredictions ?? u.totalPredictions ?? 0,
        isActive: (u.Status ?? u.status) === 'active',
      }));
      setUsers(list);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error fetching users'));
    } finally {
      setLoading(false);
    }
  };

  const fetchInvitations = async () => {
    try {
      const data = await getInvitations();
      setInvitations(data.invitations);
    } catch (err) {
      console.error('Error fetching invitations:', err);
    }
  };

  const sendInvitationHandler = async (data: InvitationRequest): Promise<CreateInvitationResponse> => {
    const raw: any = await sendInvitation(data);
    await fetchInvitations();
    // La API devuelve PascalCase desde C#
    return {
      link: raw.Link ?? raw.link ?? '',
      expiresAt: raw.ExpiresAt ?? raw.expiresAt ?? '',
      invitationCode: raw.InvitationCode ?? raw.invitationCode ?? '',
    };
  };

  const resetPasswordHandler = async (userId: string, newPassword: string) => {
    try {
      await resetUserPassword(userId, { userId, newPassword });
      // Refrescar usuarios después de resetear contraseña
      await fetchUsers();
    } catch (err) {
      throw err;
    }
  };

  const toggleActiveHandler = async (userId: string, isActive: boolean) => {
    try {
      const updatedUser = await toggleUserActive(userId, isActive);
      setUsers(users.map((u) => (u.userId === userId ? updatedUser : u)));
    } catch (err) {
      throw err;
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchInvitations();
  }, []);

  return {
    users,
    invitations,
    loading,
    error,
    fetchUsers,
    sendInvitation: sendInvitationHandler,
    resetPassword: resetPasswordHandler,
    toggleActive: toggleActiveHandler,
  };
}
