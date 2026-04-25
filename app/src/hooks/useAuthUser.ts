import { useEffect, useState, useCallback } from 'react';
import { getAuthMe, getStoredUser, getStoredToken } from '../services/auth';
import { getApiBase } from '../services/apiClient';
import type { ClientPrincipal, UserProfile } from '../services/auth';

export interface AuthUser {
  user: ClientPrincipal | UserProfile | null;
  loading: boolean;
  error: Error | null;
}

const PROFILE_CACHE_TTL = 5 * 60 * 1000; // 5 minutos
const CACHE_KEY = 'user_fetched_at';

// Deduplicación: si hay un fetch en vuelo, todos los hooks comparten la misma promesa
let pendingProfileFetch: Promise<UserProfile | null> | null = null;

function isCacheFresh(): boolean {
  const ts = parseInt(localStorage.getItem(CACHE_KEY) ?? '0', 10);
  return Date.now() - ts < PROFILE_CACHE_TTL;
}

async function fetchFreshProfile(token: string, storedUser: UserProfile | null): Promise<UserProfile | null> {
  if (pendingProfileFetch) return pendingProfileFetch;

  pendingProfileFetch = fetch(`${getApiBase()}/auth/profile`, {
    headers: { 'X-Auth-Token': token },
  })
    .then(async (res) => {
      if (!res.ok) return storedUser;
      const raw = await res.json();
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
      localStorage.setItem(CACHE_KEY, String(Date.now()));
      return fresh;
    })
    .catch(() => storedUser)
    .finally(() => { pendingProfileFetch = null; });

  return pendingProfileFetch;
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

        // Siempre mostrar caché inmediatamente
        if (storedUser) setUser(storedUser);

        // Si el caché es reciente (< 5 min) no llamar a la API
        if (storedUser && isCacheFresh()) {
          setLoading(false);
          return;
        }

        // Caché expirado o vacío → refrescar (compartiendo la promesa entre instancias)
        const fresh = await fetchFreshProfile(token, storedUser);
        if (fresh) setUser(fresh);

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

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'jwtToken') fetchAuth();
    };
    const handleLogout = () => setUser(null);

    window.addEventListener('storage', handleStorage);
    window.addEventListener('auth-logout', handleLogout);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('auth-logout', handleLogout);
    };
  }, [fetchAuth]);

  return { user, loading, error };
}
