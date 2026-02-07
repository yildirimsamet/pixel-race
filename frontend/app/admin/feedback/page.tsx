'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import type { FeedbackItem, FeedbackUpdateRequest } from '@/lib/api/features/admin-client';

const FEEDBACK_TYPES = {
  SUGGESTION: { label: 'Suggestion', color: 'blue' },
  BUG_REPORT: { label: 'Bug Report', color: 'red' },
  COMPLIANT: { label: 'Complaint', color: 'orange' },
  QUESTION: { label: 'Question', color: 'purple' },
  OTHER: { label: 'Other', color: 'gray' }
};

const STATUS_OPTIONS: Array<'NEW' | 'REVIEWED' | 'RESOLVED' | 'CLOSED'> = [
  'NEW',
  'REVIEWED',
  'RESOLVED',
  'CLOSED'
];

export default function FeedbackManagement() {
  const router = useRouter();
  const { user, loading: authLoading, refetch: refetchUser } = useAuth();

  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');

  useEffect(() => {
    if (!authLoading && (!user || !user.is_admin)) {
      router.replace('/');
    }
  }, [authLoading, user?.is_admin, router]);

  const fetchFeedback = async () => {
    if (!user?.is_admin) return;

    setIsLoading(true);
    try {
      const data = await api.admin.getAllFeedback(
        selectedType || undefined,
        selectedStatus || undefined
      );
      setFeedback(data);
    } catch (err) {
      console.error('Failed to fetch feedback:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedback();
  }, [user?.is_admin, selectedType, selectedStatus]);

  if (authLoading || !user?.is_admin) return null;

  const unreviewed = feedback.filter((f) => f.status === 'new').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-white">Feedback Management</h1>
          {unreviewed > 0 && (
            <p className="text-yellow-400 mt-2">
              {unreviewed} unreviewed feedback item{unreviewed !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        <div>
          <label className="block text-sm text-gray-400 mb-2">Filter by Type</label>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="">All Types</option>
            {Object.entries(FEEDBACK_TYPES).map(([key, { label }]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-2">Filter by Status</label>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="">All Statuses</option>
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin text-4xl text-purple-500">⚙️</div>
        </div>
      ) : feedback.length === 0 ? (
        <div className="p-8 bg-gray-800/30 border border-gray-700 rounded-lg text-center">
          <p className="text-gray-400">No feedback found with selected filters</p>
        </div>
      ) : (
        <div className="space-y-4">
          {feedback.map((item) => (
            <div key={item.id} className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
              <h3 className="text-lg font-semibold text-white">{item.subject}</h3>
              <p className="text-white whitespace-pre-wrap">{item.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
