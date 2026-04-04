import { useState, useEffect } from 'react';
import { getUsers, sendInvitation, resetUserPassword, toggleUserActive } from '../services/apiClient';
import { MOCK_USERS, MOCK_INVITATIONS } from '../services/mockData';
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
      if (import.meta.env.DEV) {
        setUsers(MOCK_USERS);
        setInvitations(MOCK_INVITATIONS);
      } else {
        setError(err instanceof Error ? err : new Error('Error fetching users'));
      }
    } finally {
      setLoading(false);
    }
  };

  const sendInvitationHandler = async (data: InvitationRequest) => {
    try {
      const invitation = await sendInvitation(data);
      setInvitations([...invitations, invitation]);
    } catch (err) {
      if (import.meta.env.DEV) {
        // Mock: crear invitación local
        const newInvitation: Invitation = {
          id: `inv-${Date.now()}`,
          email: data.email,
          displayName: data.displayName,
          status: 'pending',
          sentAtUtc: new Date().toISOString(),
          invitationCode: Math.random().toString(36).substring(2, 9).toUpperCase(),
        };
        setInvitations([...invitations, newInvitation]);
      } else {
        throw err;
      }
    }
  };

  const resetPasswordHandler = async (userId: string, newPassword: string) => {
    try {
      await resetUserPassword(userId, { userId, newPassword });
      // Refrescar usuarios después de resetear contraseña
      await fetchUsers();
    } catch (err) {
      if (!import.meta.env.DEV) {
        throw err;
      }
    }
  };

  const toggleActiveHandler = async (userId: string, isActive: boolean) => {
    try {
      const updatedUser = await toggleUserActive(userId, isActive);
      setUsers(users.map((u) => (u.userId === userId ? updatedUser : u)));
    } catch (err) {
      if (import.meta.env.DEV) {
        // Mock: actualizar localmente
        setUsers(
          users.map((u) =>
            u.userId === userId ? { ...u, isActive } : u
          )
        );
      } else {
        throw err;
      }
    }
  };

  useEffect(() => {
    fetchUsers();
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
