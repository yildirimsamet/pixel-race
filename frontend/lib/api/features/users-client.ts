import { apiClient } from '../client';
import { TransactionHistoryResponse } from '../types';
import { User } from '@/types';

export const usersApi = {
  getMe: async (): Promise<User> => {
    const { data } = await apiClient.get<User>('/users/me');
    return data;
  },

  connectWallet: async (walletData: { wallet_address: string; signature: string }): Promise<User> => {
    const { data } = await apiClient.post<User>('/users/connect-wallet', walletData);
    return data;
  },

  getTransactions: async (limit: number = 50): Promise<TransactionHistoryResponse> => {
    const { data } = await apiClient.get<TransactionHistoryResponse>('/users/me/transactions', {
      params: { limit }
    });
    return data;
  },
};
