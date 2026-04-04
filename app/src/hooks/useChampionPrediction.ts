import { useState, useEffect } from 'react';

export interface ChampionPrediction {
  team: string;
  flag: string;
  savedAt: string;
}

const CHAMPIONSHIP_DEADLINE = new Date('2026-06-11T00:00:00Z'); // Primer partido
const STORAGE_KEY = 'champion-prediction';

export function useChampionPrediction() {
  const [prediction, setPrediction] = useState<ChampionPrediction | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Determinar si la predicción está bloqueada (fuera de desarrollo y pasó la fecha límite)
  const isLocked = !import.meta.env.DEV && new Date() >= CHAMPIONSHIP_DEADLINE;

  // Cargar predicción guardada
  useEffect(() => {
    const loadPrediction = async () => {
      try {
        if (import.meta.env.DEV) {
          // En desarrollo: usar localStorage
          const stored = localStorage.getItem(STORAGE_KEY);
          if (stored) {
            setPrediction(JSON.parse(stored));
          }
        } else {
          // En producción: llamar a API
          const response = await fetch('/api/champion-prediction/me');
          if (response.ok) {
            const data = await response.json();
            setPrediction(data);
          }
        }
        setError(null);
      } catch (err) {
        console.error('Error loading champion prediction:', err);
        setError(err instanceof Error ? err : new Error('Error cargando predicción'));
      } finally {
        setLoading(false);
      }
    };

    loadPrediction();
  }, []);

  const save = async (team: string, flag: string) => {
    if (isLocked) {
      setError(new Error('El plazo para elegir tu campeón ha cerrado'));
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const newPrediction: ChampionPrediction = {
        team,
        flag,
        savedAt: new Date().toISOString(),
      };

      if (import.meta.env.DEV) {
        // En desarrollo: guardar en localStorage
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newPrediction));
        setPrediction(newPrediction);
      } else {
        // En producción: enviar a API
        const response = await fetch('/api/champion-prediction', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ team, flag }),
        });

        if (!response.ok) {
          throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();
        setPrediction(data);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error guardando predicción';
      setError(new Error(errorMsg));
      console.error('Error saving champion prediction:', err);
    } finally {
      setSaving(false);
    }
  };

  const clear = async () => {
    if (isLocked) {
      setError(new Error('No puedes cambiar tu predicción después de la fecha límite'));
      return;
    }

    try {
      if (import.meta.env.DEV) {
        localStorage.removeItem(STORAGE_KEY);
      } else {
        await fetch('/api/champion-prediction', { method: 'DELETE' });
      }
      setPrediction(null);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error borrando predicción'));
    }
  };

  return { prediction, saving, loading, error, isLocked, save, clear };
}
