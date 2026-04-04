import { useEffect, useState } from 'react';
import type { Match } from '../types';
import { getMatches } from '../services/apiClient';
import { MOCK_MATCHES } from '../services/mockData';

export interface UseMatchesResult {
  matches: Match[];
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useMatches(): UseMatchesResult {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchMatches = async () => {
    try {
      setLoading(true);
      const data = await getMatches();
      setMatches(data);
      setError(null);
    } catch (err) {
      console.warn('Error fetching matches, using mock data:', err);
      // En desarrollo, usar mock data si hay error
      if (import.meta.env.DEV) {
        setMatches(MOCK_MATCHES);
        setError(null);
      } else {
        setError(err instanceof Error ? err : new Error('Failed to fetch matches'));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, []);

  return { matches, loading, error, refetch: fetchMatches };
}
