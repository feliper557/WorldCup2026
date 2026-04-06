import { useEffect, useState } from 'react';
import { syncResults } from '../services/apiClient';

const COOLDOWN_MS = 10 * 60 * 1000; // 10 minutos
const STORAGE_KEY = 'lastResultsSync';

interface UseSyncResultsOptions {
  onUpdated?: () => void;
  enabled?: boolean;
}

export function useSyncResults(options: UseSyncResultsOptions = {}) {
  const { onUpdated, enabled = true } = options;
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    const lastSync = localStorage.getItem(STORAGE_KEY);
    const now = Date.now();

    // Check if cooldown is still active
    if (lastSync) {
      const lastSyncTime = parseInt(lastSync);
      if (now - lastSyncTime < COOLDOWN_MS) {
        return; // Cooldown activo, no sincronizar
      }
    }

    // Cooldown no activo, proceder con sync
    setSyncing(true);
    syncResults()
      .then((data) => {
        localStorage.setItem(STORAGE_KEY, String(now));
        if (data.updatedCount > 0 && onUpdated) {
          onUpdated(); // Refetch de matches si hubo actualizaciones
        }
      })
      .catch((err) => {
        console.error('Error syncing results:', err);
      })
      .finally(() => {
        setSyncing(false);
      });
  }, [enabled, onUpdated]);

  return { syncing };
}
