import { apiClient } from '../client';
import { ValidationResponse, BuyBoxRequest } from '../types';
import { Horse, HorseStatsDetailResponse, HorseBuyResponse, HorseTrainResponse } from '@/types';

export const horsesApi = {
  getAll: async (): Promise<Horse[]> => {
    const { data } = await apiClient.get<Horse[]>('/horses/');
    return data;
  },

  buyBox: async (request: BuyBoxRequest): Promise<HorseBuyResponse> => {
    const { data } = await apiClient.post<HorseBuyResponse>('/horses/boxes/buy', request);
    return data;
  },

  canBuyBox: async (maxLevel: number): Promise<ValidationResponse> => {
    const { data } = await apiClient.get<ValidationResponse>('/horses/boxes/can-buy', {
      params: { max_level: maxLevel }
    });
    return data;
  },

  getStats: async (horseId: string): Promise<HorseStatsDetailResponse> => {
    const { data } = await apiClient.get<HorseStatsDetailResponse>(`/horses/${horseId}/stats`);
    return data;
  },

  feedHorse: async (horseId: string, transactionSignature: string): Promise<Horse> => {
    const { data } = await apiClient.post<Horse>(`/horses/${horseId}/feed`, {
      transaction_signature: transactionSignature
    });
    return data;
  },

  restHorse: async (horseId: string, transactionSignature: string): Promise<Horse> => {
    const { data } = await apiClient.post<Horse>(`/horses/${horseId}/rest`, {
      transaction_signature: transactionSignature
    });
    return data;
  },

  trainHorse: async (horseId: string, transactionSignature: string): Promise<HorseTrainResponse> => {
    const { data } = await apiClient.post<HorseTrainResponse>(`/horses/${horseId}/train`, {
      transaction_signature: transactionSignature
    });
    return data;
  },

  mintNFT: async (horseId: string): Promise<Horse> => {
    const { data } = await apiClient.post<Horse>(`/horses/${horseId}/mint-nft`);
    return data;
  },
};
