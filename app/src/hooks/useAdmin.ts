import { useState, useEffect } from 'react';
import { getUsers, getInvitations, sendInvitation, resetUserPassword, toggleUserActive } from '../services/apiClient';
import type { AdminUser, InvitationRequest, Invitation } from '../types/admin';

interface UseAdminResult {
  users: AdminUser[];
  invitations: Invitation[];
  loading: boolean;
  error: Error | null;
  fetchUsers: () => Promise<void>;
  sendInvitation: (data: InvitationRequest) => Promise<void>;
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
      setUsers(data);
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

  const sendInvitationHandler = async (data: InvitationRequest) => {
    try {
      await sendInvitation(data);
      await fetchInvitations();
    } catch (err) {
      throw err;
    }
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
