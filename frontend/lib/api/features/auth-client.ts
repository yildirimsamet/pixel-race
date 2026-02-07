import { apiClient } from '../client';
import { LoginResponse, WalletLoginRequest } from '../types';

export const authApi = {
  register: async (username: string, password: string): Promise<LoginResponse> => {
    const { data } = await apiClient.post<LoginResponse>('/auth/register', { username, password });
    return data;
  },

  login: async (username: string, password: string): Promise<LoginResponse> => {
    const { data } = await apiClient.post<LoginResponse>('/auth/login', { username, password });
    return data;
  },

  walletLogin: async (request: WalletLoginRequest): Promise<LoginResponse> => {
    const { data } = await apiClient.post<LoginResponse>('/auth/wallet-login', request);
    return data;
  },
};
