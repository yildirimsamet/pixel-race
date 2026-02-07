'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useNotifications } from '@/hooks/useNotifications';
import { Notification, NotificationType } from '@/types';
import { IoNotifications, IoClose } from 'react-icons/io5';
import { FaTrophy, FaExclamationTriangle, FaMoneyBillWave, FaExternalLinkAlt, FaFlagCheckered } from 'react-icons/fa';

const SOLANA_EXPLORER_BASE = process.env.NEXT_PUBLIC_SOLANA_NETWORK === 'mainnet-beta'
  ? 'https://explorer.solana.com'
  : 'https://explorer.solana.com/?cluster=devnet';

function getNotificationIcon(type: NotificationType) {
  switch (type) {
    case 'race_join':
      return <FaFlagCheckered className="text-red-400 text-xl" />;
    case 'race_win':
      return <FaTrophy className="text-green-400 text-xl" />;
    case 'race_cancelled':
      return <FaExclamationTriangle className="text-orange-400 text-xl" />;
    case 'refund':
      return <FaMoneyBillWave className="text-green-400 text-xl" />;
    default:
      return <IoNotifications className="text-blue-400 text-xl" />;
  }
}

function getNotificationStyle(type: NotificationType, isRead: boolean) {
  const baseStyle = isRead ? '' : 'bg-opacity-20';

  switch (type) {
    case 'race_join':
      return `border-l-4 border-red-500 ${!isRead ? 'bg-red-900/20' : ''}`;
    case 'race_win':
      return `border-l-4 border-green-500 ${!isRead ? 'bg-green-900/20' : ''}`;
    case 'race_cancelled':
      return `border-l-4 border-orange-500 ${!isRead ? 'bg-orange-900/20' : ''}`;
    case 'refund':
      return `border-l-4 border-green-500 ${!isRead ? 'bg-green-900/20' : ''}`;
    default:
      return `border-l-4 border-blue-500 ${!isRead ? 'bg-purple-900/20' : ''}`;
  }
}

function getAmountStyle(type: NotificationType) {
  switch (type) {
    case 'race_join':
      return 'text-red-400';
    case 'race_win':
    case 'refund':
      return 'text-green-400';
    default:
      return 'text-gray-400';
  }
}

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => Promise<void>;
  onClose: () => void;
}

function NotificationItem({ notification, onMarkAsRead, onClose }: NotificationItemProps) {
  const handleClick = async () => {
    if (!notification.is_read) {
      try {
        await onMarkAsRead(notification.id);
      } catch (error) {
        console.error('Failed to mark as read:', error);
      }
    }
  };

  const formatRelativeTime = (dateString: string) => {
    const isoString = dateString.endsWith('Z') ? dateString : `${dateString}Z`;
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formattedDate = formatRelativeTime(notification.created_at);

  return (
    <div
      onClick={handleClick}
      className={`p-3 border-b border-gray-700/50 hover:bg-white/5 transition-all duration-200 cursor-pointer ${
        getNotificationStyle(notification.type, notification.is_read)
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-1">
          {getNotificationIcon(notification.type)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className={`text-sm font-semibold ${!notification.is_read ? 'text-white' : 'text-gray-300'}`}>
              {notification.title}
            </h4>
            {!notification.is_read && (
              <span className="flex-shrink-0 w-2 h-2 bg-purple-500 rounded-full mt-1" />
            )}
          </div>
          <p className="text-xs text-gray-400 mt-1 line-clamp-2">
            {notification.message}
          </p>
          {notification.amount_sol !== null && (
            <p className={`text-xs font-semibold mt-1 ${getAmountStyle(notification.type)}`}>
              {notification.type === 'race_join' ? '-' : '+'}{notification.amount_sol.toFixed(4)} SOL
            </p>
          )}
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-gray-500">{formattedDate}</span>
            {notification.transaction_signature && (
              <a
                href={`${SOLANA_EXPLORER_BASE}/tx/${notification.transaction_signature}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
                className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 transition-colors"
              >
                View TX <FaExternalLinkAlt className="text-[10px]" />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { notifications, unreadCount, isLoading, markAsRead, markAllAsRead } = useNotifications(false, 5);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-white/10 transition-all duration-300 group"
        aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
      >
        <IoNotifications className="text-2xl text-gray-300 group-hover:text-purple-400 transition-colors" />
        {unreadCount > 0 && (
          <>
            <span className="absolute top-1 right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600 border-2 border-gray-900"></span>
            </span>
            <span className="absolute -top-1 -right-1 bg-gradient-to-r from-red-600 to-red-700 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center shadow-lg shadow-red-500/50">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          </>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-full translate-x-1/2 mt-2 w-80 sm:w-96 glass border border-purple-500/30 rounded-lg shadow-neon-lg overflow-hidden z-50">
          <div className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 px-4 py-3 border-b border-gray-700/50">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-semibold">Notifications</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Close notifications"
              >
                <IoClose className="text-xl" />
              </button>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto" />
                <p className="text-gray-400 text-sm mt-2">Loading notifications...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <IoNotifications className="text-4xl text-gray-600 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">No notifications yet</p>
              </div>
            ) : (
              <>
                {notifications.map(notification => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkAsRead={markAsRead}
                    onClose={() => setIsOpen(false)}
                  />
                ))}
              </>
            )}
          </div>

          {notifications.length > 0 && (
            <div className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 px-4 py-3 border-t border-gray-700/50 flex items-center justify-between gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-xs text-purple-400 hover:text-purple-300 font-medium transition-colors"
                >
                  Mark all as read
                </button>
              )}
              <Link
                href="/notifications"
                onClick={() => setIsOpen(false)}
                className="text-xs text-purple-400 hover:text-purple-300 font-medium transition-colors ml-auto"
              >
                View All
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
