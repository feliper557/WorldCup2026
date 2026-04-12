import { useEffect, useState, useCallback } from 'react';
import { getAuthMe, getStoredUser, getStoredToken } from '../services/auth';
import { getApiBase } from '../services/apiClient';
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
        // Mostrar datos cacheados inmediatamente para no bloquear la UI
        const storedUser = getStoredUser();
        if (storedUser) setUser(storedUser);

        // Refrescar desde la API para tener puntos actualizados
        try {
          const response = await fetch(`${getApiBase()}/auth/profile`, {
            headers: { 'X-Auth-Token': token },
          });
          if (response.ok) {
            const raw = await response.json();
            const fresh: UserProfile = {
              id:                 raw.Id               ?? raw.id               ?? storedUser?.id,
              email:              raw.Email            ?? raw.email            ?? storedUser?.email,
              displayName:        raw.DisplayName      ?? raw.displayName      ?? storedUser?.displayName ?? '',
              role:               raw.Role             ?? raw.role             ?? storedUser?.role ?? 'user',
              status:             raw.Status           ?? raw.status           ?? 'active',
              phoneNumber:        raw.PhoneNumber      ?? raw.phoneNumber      ?? storedUser?.phoneNumber,
              isEmailVerified:    raw.IsEmailVerified  ?? raw.isEmailVerified  ?? true,
              totalPoints:        raw.TotalPoints      ?? raw.totalPoints      ?? 0,
              totalPredictions:   raw.TotalPredictions ?? raw.totalPredictions ?? 0,
              correctPredictions: raw.CorrectPredictions ?? raw.correctPredictions ?? 0,
              accuracyPercentage: raw.AccuracyPercentage ?? raw.accuracyPercentage ?? 0,
              leaderboardRank:    raw.LeaderboardRank  ?? raw.leaderboardRank  ?? 0,
              createdAt:          raw.CreatedAt        ?? raw.createdAt        ?? '',
            };
            localStorage.setItem('user', JSON.stringify(fresh));
            setUser(fresh);
          }
        } catch { /* silencioso — usamos caché si falla */ }

        setLoading(false);
        return;
      }

      // Sin JWT → intentar Azure SWA auth
      setUser(null);
      const authMe = await getAuthMe();
      if (authMe.clientPrincipal) setUser(authMe.clientPrincipal);
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
