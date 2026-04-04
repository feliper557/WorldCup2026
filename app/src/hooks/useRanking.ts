import { useEffect, useState } from 'react';
import type { Score } from '../types';
import { getRanking } from '../services/apiClient';
import { MOCK_RANKING } from '../services/mockData';

export interface UseRankingResult {
  ranking: Score[];
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useRanking(): UseRankingResult {
  const [ranking, setRanking] = useState<Score[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchRanking = async () => {
    try {
      setLoading(true);
      const data = await getRanking();
      setRanking(data);
      setError(null);
    } catch (err) {
      console.warn('Error fetching ranking, using mock data:', err);
      // En desarrollo, usar mock data si hay error
      if (import.meta.env.DEV) {
        setRanking(MOCK_RANKING);
        setError(null);
      } else {
        setError(err instanceof Error ? err : new Error('Failed to fetch ranking'));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRanking();
  }, []);

  return { ranking, loading, error, refetch: fetchRanking };
}
