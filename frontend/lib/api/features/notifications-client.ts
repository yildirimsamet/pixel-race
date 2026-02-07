import { apiClient } from '../client';
import { Notification } from '@/types';

export const notificationsApi = {
  getAll: async (unreadOnly?: boolean, limit?: number): Promise<Notification[]> => {
    const { data } = await apiClient.get<Notification[]>('/notifications/', {
      params: { unread_only: unreadOnly, limit }
    });
    return data;
  },

  getUnreadCount: async (): Promise<number> => {
    const { data } = await apiClient.get<{ unread_count: number }>('/notifications/unread-count');
    return data.unread_count;
  },

  markAsRead: async (notificationId: string): Promise<Notification> => {
    const { data } = await apiClient.patch<Notification>(`/notifications/${notificationId}/read`);
    return data;
  },

  markAllAsRead: async (): Promise<{ updated_count: number }> => {
    const { data } = await apiClient.post<{ updated_count: number }>('/notifications/mark-all-read');
    return data;
  },

  deleteNotification: async (notificationId: string): Promise<void> => {
    await apiClient.delete(`/notifications/${notificationId}`);
  },
};
