import { useEffect, useState } from 'react';
import type { Prediction, PredictionRequest } from '../types';
import { getMyPredictions, upsertPrediction as apiUpsertPrediction } from '../services/apiClient';
import { MOCK_PREDICTIONS } from '../services/mockData';

export interface UsePredictionsResult {
  predictions: Prediction[];
  loading: boolean;
  error: Error | null;
  upsertPrediction: (body: PredictionRequest) => Promise<Prediction>;
  refetch: () => void;
}

export function usePredictions(): UsePredictionsResult {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchPredictions = async () => {
    try {
      setLoading(true);
      const data = await getMyPredictions();
      setPredictions(data);
      setError(null);
    } catch (err) {
      console.warn('Error fetching predictions, using mock data:', err);
      // En desarrollo, usar mock data si hay error
      if (import.meta.env.DEV) {
        setPredictions(MOCK_PREDICTIONS);
        setError(null);
      } else {
        setError(err instanceof Error ? err : new Error('Failed to fetch predictions'));
      }
    } finally {
      setLoading(false);
    }
  };

  const upsertPrediction = async (body: PredictionRequest): Promise<Prediction> => {
    try {
      const result = await apiUpsertPrediction(body);
      // Actualizar el estado local con la nueva predicción
      setPredictions((prev) => {
        const index = prev.findIndex((p) => p.matchId === body.matchId);
        if (index >= 0) {
          const updated = [...prev];
          updated[index] = result;
          return updated;
        }
        return [...prev, result];
      });
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to upsert prediction');
      setError(error);
      throw error;
    }
  };

  useEffect(() => {
    fetchPredictions();
  }, []);

  return { predictions, loading, error, upsertPrediction, refetch: fetchPredictions };
}
