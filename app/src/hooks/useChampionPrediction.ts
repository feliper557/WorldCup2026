import { useState, useEffect } from 'react';
import { getStoredToken } from '../services/auth';

export interface ChampionPrediction {
  team: string;
  flag: string;
  savedAt: string;
}

const CHAMPIONSHIP_DEADLINE = new Date('2026-06-11T00:00:00Z'); // Primer partido

const getAuthHeaders = () => {
  const token = getStoredToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

export function useChampionPrediction() {
  const [prediction, setPrediction] = useState<ChampionPrediction | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Determinar si la predicción está bloqueada (pasó la fecha límite)
  const isLocked = new Date() >= CHAMPIONSHIP_DEADLINE;

  // Cargar predicción guardada
  useEffect(() => {
    const loadPrediction = async () => {
      try {
        const response = await fetch('/api/champion-prediction/me', {
          headers: getAuthHeaders(),
        });
        if (response.ok) {
          const data = await response.json();
          setPrediction(data);
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

      const response = await fetch('/api/champion-prediction', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ team, flag }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`API Error: ${response.status} - ${errorData}`);
      }

      const data = await response.json();
      setPrediction(data);
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
      const response = await fetch('/api/champion-prediction', {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }
      setPrediction(null);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error borrando predicción'));
    }
  };

  return { prediction, saving, loading, error, isLocked, save, clear };
}
