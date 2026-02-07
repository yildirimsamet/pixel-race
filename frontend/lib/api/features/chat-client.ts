import { apiClient } from '../client';

export interface ChatMessage {
  id: string;
  race_id: string;
  user_id: string | null;
  message: string;
  created_at: string;
  user_wallet: string | null;
}

export interface ChatMessageListResponse {
  messages: ChatMessage[];
  total: number;
  page: number;
  page_size: number;
  has_more: boolean;
}

export const chatApi = {
  getMessages: async (
    raceId: string,
    page: number = 1,
    pageSize: number = 50
  ): Promise<ChatMessageListResponse> => {
    const { data } = await apiClient.get<ChatMessageListResponse>(
      `/chat/races/${raceId}/messages`,
      { params: { page, page_size: pageSize } }
    );
    return data;
  },

  getRecentMessages: async (
    raceId: string,
    limit: number = 50
  ): Promise<ChatMessage[]> => {
    const { data } = await apiClient.get<ChatMessage[]>(
      `/chat/races/${raceId}/messages/recent`,
      { params: { limit } }
    );
    return data;
  },

  sendMessage: async (
    raceId: string,
    message: string
  ): Promise<ChatMessage> => {
    const { data } = await apiClient.post<ChatMessage>(
      `/chat/races/${raceId}/messages`,
      { message }
    );
    return data;
  },
};
