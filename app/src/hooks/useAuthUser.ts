import { useEffect, useState, useCallback } from 'react';
import { getAuthMe, getStoredUser, getStoredToken } from '../services/auth';
import type { ClientPrincipal, UserProfile } from '../services/auth';

export interface AuthUser {
  user: ClientPrincipal | UserProfile | null;
  loading: boolean;
  error: Error | null;
}

export function useAuthUser(): AuthUser {
  const [user, setUser] = useState<ClientPrincipal | UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAuth = useCallback(async () => {
    try {
      const token = getStoredToken();
      if (token) {
        const storedUser = getStoredUser();
        if (storedUser) {
          setUser(storedUser);
          setLoading(false);
          return;
        }
      }

      // Si no hay JWT, limpiar usuario e intentar Azure SWA auth
      setUser(null);
      const authMe = await getAuthMe();
      if (authMe.clientPrincipal) {
        setUser(authMe.clientPrincipal);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAuth();

    // Escuchar cambios en localStorage (logout desde otra pestaña o mismo tab)
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'jwtToken') {
        fetchAuth();
      }
    };

    // Escuchar evento custom para logout en la misma pestaña
    const handleLogout = () => {
      setUser(null);
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('auth-logout', handleLogout);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('auth-logout', handleLogout);
    };
  }, [fetchAuth]);

  return { user, loading, error };
}
