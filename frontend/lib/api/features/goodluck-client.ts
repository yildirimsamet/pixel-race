import { apiClient } from '../client';
import { BuyGoodLuckRequest, UseGoodLuckRequest, GoodLuckResponse } from '../types';

export const goodluckApi = {
  buy: async (request: BuyGoodLuckRequest): Promise<GoodLuckResponse> => {
    const { data } = await apiClient.post<GoodLuckResponse>('/goodluck/buy', request);
    return data;
  },

  useOnRace: async (raceId: string, request: UseGoodLuckRequest): Promise<GoodLuckResponse> => {
    const { data } = await apiClient.post<GoodLuckResponse>(`/goodluck/races/${raceId}/use`, request);
    return data;
  },
};
