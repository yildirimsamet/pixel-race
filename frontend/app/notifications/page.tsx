'use client';

import { useState } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationType } from '@/types';
import { IoNotifications, IoTrash, IoCheckmark, IoCheckmarkDone } from 'react-icons/io5';
import { FaTrophy, FaExclamationTriangle, FaMoneyBillWave, FaExternalLinkAlt, FaFilter } from 'react-icons/fa';
import { toast } from '@/lib/toast';

const SOLANA_EXPLORER_BASE = process.env.NEXT_PUBLIC_SOLANA_NETWORK === 'mainnet-beta'
  ? 'https://explorer.solana.com'
  : 'https://explorer.solana.com/?cluster=devnet';

function getNotificationIcon(type: NotificationType) {
  switch (type) {
    case 'race_win':
      return <FaTrophy className="text-yellow-400 text-2xl" />;
    case 'race_cancelled':
      return <FaExclamationTriangle className="text-orange-400 text-2xl" />;
    case 'refund':
      return <FaMoneyBillWave className="text-green-400 text-2xl" />;
    default:
      return <IoNotifications className="text-blue-400 text-2xl" />;
  }
}

const typeLabels: Record<NotificationType | 'all', string> = {
  all: 'All',
  race_join: 'Race Join',
  race_win: 'Race Win',
  race_cancelled: 'Cancelled',
  refund: 'Refund',
};

export default function NotificationsPage() {
  const [filter, setFilter] = useState<NotificationType | 'all'>('all');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const { notifications, unreadCount, isLoading, markAsRead, markAllAsRead, deleteNotification } = useNotifications(showUnreadOnly);

  const filteredNotifications = filter === 'all'
    ? notifications
    : notifications.filter(n => n.type === filter);

  const handleMarkAsRead = async (id: string) => {
    try {
      await markAsRead(id);
      toast.success('Marked as read');
    } catch (error) {
      toast.error('Failed to mark as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      toast.success('All notifications marked as read');
    } catch (error) {
      toast.error('Failed to mark all as read');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteNotification(id);
      toast.success('Notification deleted');
    } catch (error) {
      toast.error('Failed to delete notification');
    }
  };

  const formattedDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="glass border border-purple-500/30 rounded-lg shadow-neon-lg overflow-hidden">
        <div className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 px-6 py-4 border-b border-gray-700/50">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <IoNotifications className="text-3xl text-purple-400" />
              <div>
                <h1 className="text-2xl font-bold text-white">Notifications</h1>
                {unreadCount > 0 && (
                  <p className="text-sm text-gray-400">
                    {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
                  </p>
                )}
              </div>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 px-4 py-2 rounded-lg transition-all duration-300 text-sm font-medium shadow-neon hover:scale-105"
              >
                <IoCheckmarkDone className="text-lg" />
                Mark All Read
              </button>
            )}
          </div>

          <div className="flex items-center gap-4 mt-4 flex-wrap">
            <div className="flex items-center gap-2">
              <FaFilter className="text-gray-400 text-sm" />
              <span className="text-sm text-gray-400">Filter:</span>
            </div>
            {Object.entries(typeLabels).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setFilter(key as NotificationType | 'all')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-300 ${
                  filter === key
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-neon'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-gray-300'
                }`}
              >
                {label}
              </button>
            ))}
            <button
              onClick={() => setShowUnreadOnly(!showUnreadOnly)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-300 ${
                showUnreadOnly
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-neon'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-gray-300'
              }`}
            >
              Unread Only
            </button>
          </div>
        </div>

        <div className="divide-y divide-gray-700/50">
          {isLoading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto" />
              <p className="text-gray-400 mt-4">Loading notifications...</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="p-12 text-center">
              <IoNotifications className="text-6xl text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">
                {filter === 'all' ? 'No notifications yet' : `No ${typeLabels[filter]} notifications`}
              </p>
              <p className="text-gray-500 text-sm mt-2">
                Check back later for updates on your races and rewards
              </p>
            </div>
          ) : (
            <>
              {filteredNotifications.map(notification => (
                <div
                  key={notification.id}
                  className={`p-6 hover:bg-white/5 transition-all duration-200 ${
                    !notification.is_read ? 'bg-purple-900/10' : ''
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className={`text-lg font-semibold ${!notification.is_read ? 'text-white' : 'text-gray-300'}`}>
                              {notification.title}
                            </h3>
                            {!notification.is_read && (
                              <span className="flex-shrink-0 w-2.5 h-2.5 bg-purple-500 rounded-full animate-pulse" />
                            )}
                          </div>
                          <p className="text-gray-400 text-sm">
                            {notification.message}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {!notification.is_read && (
                            <button
                              onClick={() => handleMarkAsRead(notification.id)}
                              className="p-2 hover:bg-purple-600/20 rounded-lg transition-colors group"
                              title="Mark as read"
                            >
                              <IoCheckmark className="text-purple-400 group-hover:text-purple-300 text-xl" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(notification.id)}
                            className="p-2 hover:bg-red-600/20 rounded-lg transition-colors group"
                            title="Delete notification"
                          >
                            <IoTrash className="text-red-400 group-hover:text-red-300 text-xl" />
                          </button>
                        </div>
                      </div>

                      {notification.amount_sol !== null && (
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-green-400 font-semibold">
                            {notification.amount_sol.toFixed(4)} SOL
                          </span>
                        </div>
                      )}

                      <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
                        <span className="text-sm text-gray-500">
                          {formattedDate(notification.created_at)}
                        </span>
                        {notification.transaction_signature && (
                          <a
                            href={`${SOLANA_EXPLORER_BASE}/tx/${notification.transaction_signature}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-sm text-purple-400 hover:text-purple-300 transition-colors font-medium"
                          >
                            View Transaction <FaExternalLinkAlt className="text-xs" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
