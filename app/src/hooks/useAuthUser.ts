import { useEffect, useState } from 'react';
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

  useEffect(() => {
    async function fetchAuth() {
      try {
        // Primero intentar obtener JWT token del localStorage
        const token = getStoredToken();
        if (token) {
          const storedUser = getStoredUser();
          if (storedUser) {
            setUser(storedUser);
            setLoading(false);
            return;
          }
        }

        // Si no hay JWT, intentar Azure Static Web Apps auth
        const authMe = await getAuthMe();
        if (authMe.clientPrincipal) {
          setUser(authMe.clientPrincipal);
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setLoading(false);
      }
    }

    fetchAuth();
  }, []);

  return { user, loading, error };
}
