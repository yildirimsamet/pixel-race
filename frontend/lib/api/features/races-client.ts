import { apiClient } from '../client';
import { ValidationResponse } from '../types';
import { Race, RaceResult, RaceEndStatsData } from '@/types';

export const racesApi = {
  getAll: async (status_filter?: string): Promise<Race[]> => {
    const { data } = await apiClient.get<Race[]>('/races/', { params: { status_filter } });
    return data;
  },

  join: async (race_id: string, horse_id: string, transaction_signature?: string): Promise<Race> => {
    const { data } = await apiClient.post<Race>(`/races/${race_id}/join`, {
      horse_id,
      transaction_signature
    });
    return data;
  },

  canJoinRace: async (raceId: string, horseId: string): Promise<ValidationResponse> => {
    const { data } = await apiClient.get<ValidationResponse>(`/races/${raceId}/can-join`, {
      params: { horse_id: horseId }
    });
    return data;
  },

  getResults: async (race_id: string): Promise<RaceResult[]> => {
    const { data } = await apiClient.get<RaceResult[]>(`/races/${race_id}/results`);
    return data;
  },

  startRace: async (race_id: string): Promise<Race> => {
    const { data } = await apiClient.post<Race>(`/races/${race_id}/start`);
    return data;
  },

  createTestRace: async (level: number = 1): Promise<Race> => {
    const { data } = await apiClient.post<Race>('/races/create-test-race', null, {
      params: { level }
    });
    return data;
  },

  autoRegisterHorses: async (race_id: string): Promise<Race> => {
    const { data } = await apiClient.post<Race>(`/races/${race_id}/auto-register-horses`);
    return data;
  },

  getMyHorseStatsAfterRace: async (race_id: string): Promise<RaceEndStatsData> => {
    const { data } = await apiClient.get<RaceEndStatsData>(`/races/${race_id}/my-horse-stats`);
    return data;
  },
};
