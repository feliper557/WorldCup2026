import { useEffect, useState } from 'react';
import type { Raffle, RaffleJoinRequest, RaffleCreateRequest } from '../types';
import { getRaffles, joinRaffle, createRaffle, drawRaffle, addRaffleParticipant, removeRaffleParticipant } from '../services/apiClient';

export interface UseRafflesResult {
  raffles: Raffle[];
  loading: boolean;
  error: Error | null;
  refetch: () => void;
  join: (raffleId: string, tickets: number) => Promise<void>;
  joining: boolean;
  createRaffle: (data: RaffleCreateRequest) => Promise<void>;
  drawRaffle: (raffleId: string) => Promise<void>;
  addParticipant: (raffleId: string, userId: string) => Promise<void>;
  removeParticipant: (raffleId: string, userId: string) => Promise<void>;
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
      setError(err instanceof Error ? err : new Error('Failed to fetch raffles'));
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
      setError(err instanceof Error ? err : new Error('Failed to create raffle'));
    } finally {
      setLoading(false);
    }
  };

  const drawRaffleHandler = async (raffleId: string) => {
    try {
      setLoading(true);
      await drawRaffle(raffleId);
      await fetchRaffles();
    } catch (err) {
      console.error('Error drawing raffle:', err);
      setError(err instanceof Error ? err : new Error('Failed to draw raffle'));
    } finally {
      setLoading(false);
    }
  };

  const addParticipantHandler = async (raffleId: string, userId: string) => {
    await addRaffleParticipant(raffleId, userId);
    await fetchRaffles();
  };

  const removeParticipantHandler = async (raffleId: string, userId: string) => {
    await removeRaffleParticipant(raffleId, userId);
    await fetchRaffles();
  };

  useEffect(() => {
    fetchRaffles();
  }, []);

  return {
    raffles,
    loading,
    error,
    refetch: fetchRaffles,
    join,
    joining,
    createRaffle: createRaffleHandler,
    drawRaffle: drawRaffleHandler,
    addParticipant: addParticipantHandler,
    removeParticipant: removeParticipantHandler,
  };
}
