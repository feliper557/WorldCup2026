import { useEffect, useState } from 'react';
import { getAuthMe } from '../services/auth';
import type { ClientPrincipal } from '../services/auth';

export interface AuthUser {
  user: ClientPrincipal | null;
  loading: boolean;
  error: Error | null;
}

// Mock user para desarrollo (comentar en producción)
const DEV_MOCK_USER: ClientPrincipal = {
  identityProvider: 'github',
  userId: 'dev-user-123',
  userDetails: 'DevUser',
  userRoles: ['user'],
};

export function useAuthUser(): AuthUser {
  const [user, setUser] = useState<ClientPrincipal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchAuth() {
      try {
        const authMe = await getAuthMe();
        // MODO DESARROLLO: Si no hay usuario, usar mock
        if (!authMe.clientPrincipal && import.meta.env.DEV) {
          setUser(DEV_MOCK_USER);
        } else {
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
