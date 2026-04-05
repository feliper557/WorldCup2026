import { useEffect, useState } from 'react';
import type { Score } from '../types';
import { getRanking } from '../services/apiClient';

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
      setError(err instanceof Error ? err : new Error('Failed to fetch ranking'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRanking();
  }, []);

  return { ranking, loading, error, refetch: fetchRanking };
}
