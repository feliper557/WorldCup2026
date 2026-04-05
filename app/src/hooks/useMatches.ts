import { useEffect, useState } from 'react';
import type { Match } from '../types';
import { getMatches } from '../services/apiClient';

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
      setError(err instanceof Error ? err : new Error('Failed to fetch matches'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, []);

  return { matches, loading, error, refetch: fetchMatches };
}
