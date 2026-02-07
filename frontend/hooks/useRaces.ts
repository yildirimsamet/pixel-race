import { useState, useEffect, useCallback } from 'react';
import { races as racesApi } from '@/lib/api';
import { Race } from '@/types';
import { ApiError } from '@/lib/api';

interface UseRacesReturn {
  races: Race[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useRaces(statusFilter?: string, refreshInterval: number = 5000): UseRacesReturn {
  const [races, setRaces] = useState<Race[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRaces = useCallback(async () => {
    try {
      setError(null);
      const data = await racesApi.getAll(statusFilter);
      setRaces(data);
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Failed to load races';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchRaces();

    if (refreshInterval > 0) {
      const interval = setInterval(fetchRaces, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchRaces, refreshInterval]);

  return { races, loading, error, refetch: fetchRaces };
}
