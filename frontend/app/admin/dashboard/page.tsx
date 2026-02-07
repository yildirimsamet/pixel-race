'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import type {
  DashboardStats,
  DashboardActivity,
  TransactionMetrics,
  ErrorLog
} from '@/lib/api/features/admin-client';
import {
  FiUsers,
  FiActivity,
  FiDollarSign,
  FiAlertTriangle,
  FiRefreshCw,
  FiMessageSquare
} from 'react-icons/fi';
import { GiHorseHead } from 'react-icons/gi';
import { MdStadium } from 'react-icons/md';
import Link from 'next/link';

export default function AdminDashboard() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activity, setActivity] = useState<DashboardActivity | null>(null);
  const [transactions, setTransactions] = useState<TransactionMetrics | null>(null);
  const [errors, setErrors] = useState<ErrorLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(false);

  useEffect(() => {
    if (!authLoading && !user?.is_admin) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [statsData, activityData, transactionsData, errorsData] = await Promise.all([
        api.admin.getDashboardStats(),
        api.admin.getDashboardActivity(24, 10),
        api.admin.getTransactionMetrics(24),
        api.admin.getRecentErrors(24, 20)
      ]);

      setStats(statsData);
      setActivity(activityData);
      setTransactions(transactionsData);
      setErrors(errorsData);
    } catch (error) {
      console.error('Failed to fetch admin data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.is_admin) {
      fetchData();
    }
  }, [user?.is_admin, fetchData]);

  useEffect(() => {
    if (autoRefresh && user?.is_admin) {
      const interval = setInterval(fetchData, 30000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, user?.is_admin, fetchData]);

  if (authLoading || !user?.is_admin) {
    return null;
  }

  if (isLoading && !stats) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin text-4xl text-purple-500">⚙️</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold text-white">Admin Dashboard</h1>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-white cursor-pointer">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="w-4 h-4 rounded border-purple-500 bg-gray-700 text-purple-600"
            />
            <span className="text-sm">Auto-refresh (30s)</span>
          </label>
          <button
            onClick={fetchData}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            <FiRefreshCw className={isLoading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-white mb-4">Platform Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={<FiUsers className="text-3xl" />}
            label="Total Users"
            value={stats?.total_users || 0}
            subValue={`+${stats?.new_users_today || 0} today`}
            color="blue"
          />
          <StatCard
            icon={<GiHorseHead className="text-3xl" />}
            label="Total Horses"
            value={stats?.total_horses || 0}
            subValue={`${stats?.horses_in_race || 0} in active races`}
            color="green"
          />
          <StatCard
            icon={<MdStadium className="text-3xl" />}
            label="Active Races"
            value={stats?.active_races || 0}
            subValue={`${stats?.completed_races_today || 0} completed today`}
            color="purple"
          />
          <StatCard
            icon={<FiDollarSign className="text-3xl" />}
            label="Active Prize Pool"
            value={`${(stats?.total_prize_pool_sol || 0).toFixed(2)} SOL`}
            subValue="Currently available"
            color="yellow"
          />
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-white mb-4">Financial Metrics (Last 24 Hours)</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            label="Total Transaction Volume"
            value={`${(transactions?.total_volume_24h || 0).toFixed(2)} SOL`}
            subValue="All transactions"
            color="purple"
          />
          <MetricCard
            label="Horse Sales"
            value={`${transactions?.horse_purchases.count || 0} horses`}
            subValue={`${(transactions?.horse_purchases.volume || 0).toFixed(2)} SOL revenue`}
            color="green"
          />
          <MetricCard
            label="Race Participations"
            value={`${transactions?.race_entries.count || 0} entries`}
            subValue={`${(transactions?.race_entries.volume || 0).toFixed(2)} SOL collected`}
            color="blue"
          />
          <MetricCard
            label="Prizes Paid Out"
            value={`${transactions?.prizes_distributed.count || 0} winners`}
            subValue={`${(transactions?.prizes_distributed.volume || 0).toFixed(2)} SOL distributed`}
            color="yellow"
          />
        </div>
        {transactions && transactions.failed_transactions > 0 && (
          <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
            <div className="flex items-center gap-2 text-red-400">
              <FiAlertTriangle />
              <span className="font-semibold">
                {transactions.failed_transactions} failed transaction{transactions.failed_transactions > 1 ? 's' : ''} in the last 24 hours
              </span>
            </div>
          </div>
        )}
      </div>

      <div>
        <h2 className="text-2xl font-bold text-white mb-4">Recent Activity (Last 24 Hours)</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <ActivitySection
            title="New Users"
            items={activity?.recent_users || []}
            renderItem={(user) => (
              <div key={user.id} className="p-3 bg-gray-800/50 rounded-lg hover:bg-gray-800/70 transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <div className="font-mono text-xs text-purple-400 truncate">
                    {user.wallet_address.slice(0, 10)}...{user.wallet_address.slice(-8)}
                  </div>
                  {user.is_bot && (
                    <span className="text-xs px-2 py-0.5 bg-orange-500/20 text-orange-400 rounded">BOT</span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <span>{user.horse_count} horses</span>
                  <span>•</span>
                  <span>{new Date(user.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            )}
          />

          <ActivitySection
            title="New Horses"
            items={activity?.recent_horses || []}
            renderItem={(horse) => (
              <div key={horse.id} className="p-3 bg-gray-800/50 rounded-lg hover:bg-gray-800/70 transition-colors">
                <div className="flex items-center gap-2 mb-1">
                  <div
                    className="w-5 h-5 rounded-full border-2 border-white/20 flex-shrink-0"
                    style={{ backgroundColor: horse.color }}
                  />
                  <span className="font-semibold text-white truncate">{horse.name}</span>
                  <span className="text-xs px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded">
                    Lvl {horse.level}
                  </span>
                </div>
                <div className="text-xs text-gray-400 font-mono truncate">
                  Owner: {horse?.owner_wallet?.slice(0, 8)}...{horse?.owner_wallet?.slice(-6)}
                </div>
              </div>
            )}
          />

          <ActivitySection
            title="Recent Races"
            items={activity?.recent_races || []}
            renderItem={(race) => (
              <div key={race.id} className="p-3 bg-gray-800/50 rounded-lg hover:bg-gray-800/70 transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold text-white">
                    Level {race.level_requirement} Race
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    race.status === 'done' ? 'bg-green-500/20 text-green-400' :
                    race.status === 'racing' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-blue-500/20 text-blue-400'
                  }`}>
                    {race.status}
                  </span>
                </div>
                <div className="text-xs text-gray-400">
                  Prize Pool: {race.prize_pool_sol.toFixed(2)} SOL
                </div>
                {race.winner_horse_name && (
                  <div className="text-xs text-green-400 mt-1 truncate">
                    🏆 {race.winner_horse_name}
                  </div>
                )}
              </div>
            )}
          />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-white">System Errors (Last 24 Hours)</h2>
          {errors.length > 0 && (
            <span className="text-sm px-3 py-1 bg-red-500/20 text-red-400 rounded-full font-semibold">
              {errors.length} error{errors.length > 1 ? 's' : ''}
            </span>
          )}
        </div>
        {errors.length === 0 ? (
          <div className="p-8 bg-green-500/10 border border-green-500/30 rounded-lg text-center">
            <div className="text-4xl mb-2">✅</div>
            <div className="text-green-400 font-semibold">No errors detected in the last 24 hours</div>
            <div className="text-sm text-gray-400 mt-1">System is running smoothly</div>
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
            {errors?.map((error, index) => (
              <ErrorLogItem key={error.id || index} error={error} />
            ))}
          </div>
        )}
      </div>

      <div className="p-6 bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FiMessageSquare className="text-4xl text-purple-400" />
            <div>
              <h3 className="text-xl font-bold text-white">User Feedback Management</h3>
              <p className="text-gray-400 text-sm">Review and respond to user suggestions, bug reports, and questions</p>
              {stats && stats.unreviewed_feedback > 0 && (
                <p className="text-yellow-400 text-sm mt-1 font-semibold">
                  ⚠️ {stats.unreviewed_feedback} unreviewed feedback waiting for attention
                </p>
              )}
            </div>
          </div>
          <Link
            href="/admin/feedback"
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-semibold shadow-lg hover:shadow-purple-500/50"
          >
            Manage Feedback
          </Link>
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subValue?: string;
  color: 'blue' | 'green' | 'purple' | 'yellow';
}

function StatCard({ icon, label, value, subValue, color }: StatCardProps) {
  const colorClasses = {
    blue: 'from-blue-600/20 to-blue-800/20 border-blue-500/30 text-blue-400',
    green: 'from-green-600/20 to-green-800/20 border-green-500/30 text-green-400',
    purple: 'from-purple-600/20 to-purple-800/20 border-purple-500/30 text-purple-400',
    yellow: 'from-yellow-600/20 to-yellow-800/20 border-yellow-500/30 text-yellow-400'
  };

  return (
    <div className={`p-6 bg-gradient-to-br ${colorClasses[color]} border rounded-lg`}>
      <div className="flex items-center justify-between mb-3">
        <div className={colorClasses[color]}>{icon}</div>
      </div>
      <div className="text-3xl font-bold text-white">{value}</div>
      <div className="text-sm text-gray-400 mt-1">{label}</div>
      {subValue && <div className="text-xs text-gray-500 mt-1">{subValue}</div>}
    </div>
  );
}

interface MetricCardProps {
  label: string;
  value: string;
  subValue?: string;
  color: 'blue' | 'green' | 'purple' | 'yellow';
}

function MetricCard({ label, value, subValue, color }: MetricCardProps) {
  const colorClasses = {
    blue: 'border-blue-500/30 bg-blue-500/5',
    green: 'border-green-500/30 bg-green-500/5',
    purple: 'border-purple-500/30 bg-purple-500/5',
    yellow: 'border-yellow-500/30 bg-yellow-500/5'
  };

  return (
    <div className={`p-4 ${colorClasses[color]} border rounded-lg`}>
      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{label}</div>
      <div className="text-2xl font-bold text-white">{value}</div>
      {subValue && <div className="text-sm text-gray-400 mt-1">{subValue}</div>}
    </div>
  );
}

interface ActivitySectionProps<T> {
  title: string;
  items: T[];
  renderItem: (item: T) => React.ReactNode;
}

function ActivitySection<T>({ title, items, renderItem }: ActivitySectionProps<T>) {
  return (
    <div>
      <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
      {items.length === 0 ? (
        <div className="p-4 bg-gray-800/30 border border-gray-700 rounded-lg text-center text-gray-500">
          No recent activity
        </div>
      ) : (
        <div className="space-y-2">{items.map(renderItem)}</div>
      )}
    </div>
  );
}

interface ErrorLogItemProps {
  error: ErrorLog;
}

function ErrorLogItem({ error }: ErrorLogItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const levelColors = {
    ERROR: 'bg-red-500/10 border-red-500/30 text-red-400',
    WARNING: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400',
    INFO: 'bg-blue-500/10 border-blue-500/30 text-blue-400'
  };

  const bgColor = levelColors[error.level as keyof typeof levelColors] || levelColors.ERROR;

  return (
    <div className={`p-4 ${bgColor} border rounded-lg`}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full text-left"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-bold">{error.level}</span>
              <span className="text-xs text-gray-400">
                {new Date(error.timestamp).toLocaleString()}
              </span>
            </div>
            <div className="text-sm mt-1">{error.message}</div>
            <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
              <span>Action: {error.action}</span>
              <span>•</span>
              <span>Step: {error.step}</span>
              {error.request_id && (
                <>
                  <span>•</span>
                  <span className="font-mono">{error.request_id}</span>
                </>
              )}
            </div>
          </div>
          <FiActivity className={`flex-shrink-0 ${isExpanded ? 'rotate-90' : ''} transition-transform`} />
        </div>
      </button>

      {isExpanded && error.metadata && Object.keys(error.metadata).length > 0 && (
        <div className="mt-3 pt-3 border-t border-current/20">
          <pre className="text-xs overflow-x-auto">
            {JSON.stringify(error.metadata, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
