import { apiClient } from '../client';

export interface DashboardStats {
  total_users: number;
  new_users_today: number;
  new_users_this_week: number;
  total_horses: number;
  horses_nft_minted: number;
  horses_in_race: number;
  total_races: number;
  active_races: number;
  completed_races_today: number;
  total_prize_pool_sol: number;
  total_feedback: number;
  unreviewed_feedback: number;
  feedback_by_type: Record<string, number>;
}

export interface RecentUser {
  id: string;
  wallet_address: string;
  created_at: string;
  is_bot: boolean;
  horse_count: number;
}

export interface RecentHorse {
  id: string;
  name: string;
  color: string;
  level: number;
  owner_wallet: string;
  created_at: string;
  nft_mint_address: string | null;
}

export interface RecentRace {
  id: string;
  level_requirement: number;
  entry_fee: number;
  prize_pool_sol: number;
  status: string;
  winner_horse_name: string | null;
  created_at: string;
}

export interface DashboardActivity {
  recent_users: RecentUser[];
  recent_horses: RecentHorse[];
  recent_races: RecentRace[];
}

export interface TransactionMetrics {
  total_volume_24h: number;
  horse_purchases: {
    count: number;
    volume: number;
  };
  race_entries: {
    count: number;
    volume: number;
  };
  prizes_distributed: {
    count: number;
    volume: number;
  };
  failed_transactions: number;
}

export interface ErrorLog {
  id: string;
  timestamp: string;
  level: string;
  message: string;
  action: string;
  step: string;
  request_id: string | null;
  user_id: string | null;
  metadata: Record<string, unknown>;
}

export interface RequestTrace {
  request_id: string;
  logs: ErrorLog[];
}

export interface FeedbackItem {
  id: string;
  type: 'SUGGESTION' | 'BUG_REPORT' | 'COMPLIANT' | 'QUESTION' | 'OTHER';
  subject: string;
  message: string;
  email: string | null;
  status: 'new' | 'reviewed' | 'resolved' | 'closed';
  admin_notes: string | null;
  user_id: string | null;
  user_wallet: string | null;
  created_at: string;
  updated_at: string;
}

export interface FeedbackUpdateRequest {
  status?: 'new' | 'reviewed' | 'resolved' | 'closed';
  admin_notes?: string;
}

export const adminApi = {
  getDashboardStats: async (): Promise<DashboardStats> => {
    const { data } = await apiClient.get<DashboardStats>('/admin/dashboard/stats');
    return data;
  },

  getDashboardActivity: async (hours: number = 24, limit: number = 10): Promise<DashboardActivity> => {
    const { data } = await apiClient.get<DashboardActivity>('/admin/dashboard/activity', {
      params: { hours, limit }
    });
    return data;
  },

  getTransactionMetrics: async (hours: number = 24): Promise<TransactionMetrics> => {
    const { data } = await apiClient.get<TransactionMetrics>('/admin/dashboard/transactions', {
      params: { hours }
    });
    return data;
  },

  getRecentErrors: async (hours: number = 24, limit: number = 20): Promise<ErrorLog[]> => {
    const { data } = await apiClient.get<{ errors: ErrorLog[] }>('/admin/logs/errors/recent', {
      params: { hours, limit }
    });
    return data.errors;
  },

  getRequestTrace: async (requestId: string): Promise<RequestTrace> => {
    const { data } = await apiClient.get<RequestTrace>(`/admin/logs/trace/${requestId}`);
    return data;
  },

  getAllFeedback: async (
    feedbackType?: string,
    status?: string
  ): Promise<FeedbackItem[]> => {
    const { data } = await apiClient.get<FeedbackItem[]>('/admin/feedback', {
      params: { type_filter: feedbackType, status_filter: status }
    });
    return data;
  },

  updateFeedback: async (
    feedbackId: string,
    updates: FeedbackUpdateRequest
  ): Promise<FeedbackItem> => {
    const { data } = await apiClient.patch<FeedbackItem>(
      `/admin/feedback/${feedbackId}`,
      updates
    );
    return data;
  }
};
