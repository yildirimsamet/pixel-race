import { useState, useEffect, useCallback } from 'react';
import { notifications as notificationsApi } from '@/lib/api';
import { Notification } from '@/types';
import { ApiError } from '@/lib/api';

const POLLING_INTERVAL = 30000;

interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
}

export function useNotifications(unreadOnly: boolean = false, limit?: number): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    if (typeof window === 'undefined') return;

    try {
      setError(null);
      const [notifData, countData] = await Promise.all([
        notificationsApi.getAll(unreadOnly, limit),
        notificationsApi.getUnreadCount(),
      ]);
      setNotifications(notifData);
      setUnreadCount(countData);
    } catch (err) {
      if (err instanceof ApiError && err.statusCode === 401) {
        setNotifications([]);
        setUnreadCount(0);
        setError(null);
      } else {
        const errorMessage = err instanceof ApiError ? err.message : 'Failed to fetch notifications';
        setError(errorMessage);
        console.error('Fetch notifications error:', err);
      }
    } finally {
      setIsLoading(false);
    }
  }, [unreadOnly, limit]);

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const updatedNotification = await notificationsApi.markAsRead(notificationId);
      setNotifications(prev =>
        prev.map(n => (n.id === notificationId ? updatedNotification : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Failed to mark notification as read';
      console.error('Mark as read error:', errorMessage);
      throw err;
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await notificationsApi.markAllAsRead();
      setNotifications(prev =>
        prev.map(n => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
      );
      setUnreadCount(0);
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Failed to mark all as read';
      console.error('Mark all as read error:', errorMessage);
      throw err;
    }
  }, []);

  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      await notificationsApi.deleteNotification(notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      const wasUnread = notifications.find(n => n.id === notificationId)?.is_read === false;
      if (wasUnread) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Failed to delete notification';
      console.error('Delete notification error:', errorMessage);
      throw err;
    }
  }, [notifications]);

  useEffect(() => {
    fetchNotifications();

    let isActive = !document.hidden;

    const handleVisibilityChange = () => {
      isActive = !document.hidden;
      if (isActive) {
        fetchNotifications();
      }
    };

    const handleAuthLogin = () => {
      fetchNotifications();
    };

    const handleAuthLogout = () => {
      setNotifications([]);
      setUnreadCount(0);
      setIsLoading(false);
      setError(null);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('auth:login', handleAuthLogin);
    window.addEventListener('auth:unauthorized', handleAuthLogout);

    const interval = setInterval(() => {
      if (isActive) {
        fetchNotifications();
      }
    }, POLLING_INTERVAL);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('auth:login', handleAuthLogin);
      window.removeEventListener('auth:unauthorized', handleAuthLogout);
    };
  }, [fetchNotifications]);

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    refetch: fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  };
}
