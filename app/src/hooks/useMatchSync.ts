import { useState } from 'react';
import { syncMatches, type SyncOptions } from '../services/apiClient';

interface SyncResult {
  success: boolean;
  message: string;
  matchesCount: number;
}

interface UseMatchSyncResult {
  loading: boolean;
  error: Error | null;
  result: SyncResult | null;
  sync: (options: SyncOptions) => Promise<void>;
}

export function useMatchSync(): UseMatchSyncResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [result, setResult] = useState<SyncResult | null>(null);

  const sync = async (options: SyncOptions) => {
    try {
      setLoading(true);
      setError(null);
      const data = await syncMatches(options);
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error syncing matches'));
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return { loading, error, result, sync };
}
