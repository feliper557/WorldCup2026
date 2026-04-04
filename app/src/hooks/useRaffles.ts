import { useEffect, useState } from 'react';
import type { Raffle, RaffleJoinRequest, RaffleCreateRequest } from '../types';
import { getRaffles, joinRaffle, createRaffle, drawRaffle } from '../services/apiClient';
import { MOCK_RAFFLES } from '../services/mockData';

export interface UseRafflesResult {
  raffles: Raffle[];
  loading: boolean;
  error: Error | null;
  refetch: () => void;
  join: (raffleId: string, tickets: number) => Promise<void>;
  joining: boolean;
  createRaffle: (data: RaffleCreateRequest) => Promise<void>;
  drawRaffle: (raffleId: string) => Promise<void>;
}

export function useRaffles(): UseRafflesResult {
  const [raffles, setRaffles] = useState<Raffle[]>([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchRaffles = async () => {
    try {
      setLoading(true);
      const data = await getRaffles();
      setRaffles(data);
      setError(null);
    } catch (err) {
      console.warn('Error fetching raffles, using mock data:', err);
      // En desarrollo, usar mock data si hay error
      if (import.meta.env.DEV) {
        setRaffles(MOCK_RAFFLES);
        setError(null);
      } else {
        setError(err instanceof Error ? err : new Error('Failed to fetch raffles'));
      }
    } finally {
      setLoading(false);
    }
  };

  const join = async (raffleId: string, tickets: number) => {
    try {
      setJoining(true);
      const request: RaffleJoinRequest = { raffleId, tickets };
      await joinRaffle(request);
      // Refrescar después de unirse
      await fetchRaffles();
    } catch (err) {
      console.error('Error joining raffle:', err);
      setError(err instanceof Error ? err : new Error('Failed to join raffle'));
    } finally {
      setJoining(false);
    }
  };

  const createRaffleHandler = async (data: RaffleCreateRequest) => {
    try {
      setLoading(true);
      await createRaffle(data);
      // Refrescar después de crear
      await fetchRaffles();
    } catch (err) {
      console.error('Error creating raffle:', err);
      if (import.meta.env.DEV) {
        // En desarrollo, simular creación
        const newRaffle: Raffle = {
          id: `raffle-${Date.now()}`,
          title: data.title,
          description: data.description,
          prize: data.prize,
          status: 'OPEN',
          maxParticipants: data.maxParticipants || null,
          participantCount: 0,
          createdAtUtc: new Date().toISOString(),
          drawAtUtc: data.drawAtUtc,
          winnerId: null,
          winnerName: null,
          participants: [],
        };
        setRaffles([...raffles, newRaffle]);
      } else {
        setError(err instanceof Error ? err : new Error('Failed to create raffle'));
      }
    } finally {
      setLoading(false);
    }
  };

  const drawRaffleHandler = async (raffleId: string) => {
    try {
      setLoading(true);
      await drawRaffle(raffleId);
      // Refrescar después de sortear
      await fetchRaffles();
    } catch (err) {
      console.error('Error drawing raffle:', err);
      if (import.meta.env.DEV) {
        // En desarrollo, simular sorteo
        setRaffles(
          raffles.map((r) => {
            if (r.id === raffleId && r.participants.length > 0) {
              const winner = r.participants[Math.floor(Math.random() * r.participants.length)];
              return {
                ...r,
                status: 'COMPLETED' as const,
                winnerId: winner.userId,
                winnerName: winner.displayName,
              };
            }
            return r;
          })
        );
      } else {
        setError(err instanceof Error ? err : new Error('Failed to draw raffle'));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRaffles();
  }, []);

  return { raffles, loading, error, refetch: fetchRaffles, join, joining, createRaffle: createRaffleHandler, drawRaffle: drawRaffleHandler };
}
