'use client';

import { useState, useEffect, useCallback } from 'react';
import { horses as horsesApi } from '@/lib/api';
import { toast } from '@/lib/toast';
import { HorseStatsDetailResponse } from '@/types';

interface HorseStatsCardProps {
  horseId: string;
  onStatsUpdate?: () => void;
}

export default function HorseStatsCard({ horseId, onStatsUpdate }: HorseStatsCardProps) {
  const [stats, setStats] = useState<HorseStatsDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    setError(null);
    try {
      const response = await horsesApi.getStats(horseId);
      setStats(response);

      if (response.dynamic_stats) {
        if (response.dynamic_stats.satiety < 10) {
          toast.warning('Your horse is very hungry!', { toastId: `satiety-${horseId}` });
        }
        if (response.dynamic_stats.energy < 10) {
          toast.warning('Your horse is exhausted!', { toastId: `energy-${horseId}` });
        }
      }

      setLoading(false);
    } catch (error: any) {
      setError('Failed to load horse stats');
      toast.error('Failed to load horse stats');
      console.error('Failed to load horse stats:', error);
      setLoading(false);
    }
  }, [horseId]);

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 30000);
    return () => clearInterval(interval);
  }, [loadStats]);

  if (loading) {
    return (
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
        <div className="text-center text-gray-400">Loading stats...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-red-700">
        <div className="text-center text-red-400 mb-4">{error}</div>
        <button
          onClick={loadStats}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg mx-auto block transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
        <div className="text-center text-gray-400">No stats available</div>
      </div>
    );
  }

  const { base_stats, dynamic_stats, performance } = stats;
  const horseName = base_stats?.name ?? 'Unknown Horse';

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
      <h3 className="text-2xl font-bold mb-6 text-white">🐎 {horseName} Stats</h3>

      <div className="mb-6 grid grid-cols-2 gap-4">
        <div className="bg-gray-700/50 rounded-lg p-3">
          <div className="text-sm text-gray-400">Age</div>
          <div className="text-xl font-bold text-white">{base_stats?.age ?? 'Unknown'} years</div>
        </div>
        <div className="bg-gray-700/50 rounded-lg p-3">
          <div className="text-sm text-gray-400">Color</div>
          <div className="text-xl font-bold text-white">{base_stats?.color ?? '#ffffff'}</div>
        </div>
      </div>

      <div className="space-y-4 mb-6">
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium text-gray-300">Weight</span>
            <span className={`text-sm font-bold`}>
              {(dynamic_stats?.weight ?? 500).toFixed(1)} kg
            </span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-blue-500 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${((dynamic_stats?.weight ?? 500) / 600) * 100}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium text-gray-300">Satiety</span>
            <span className={`text-sm font-bold`}>
              {dynamic_stats?.satiety ?? 0}/100
            </span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-yellow-500 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${dynamic_stats?.satiety ?? 0}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium text-gray-300">Energy</span>
            <span className={`text-sm font-bold`}>
              {dynamic_stats?.energy ?? 0}/100
            </span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-red-500 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${dynamic_stats?.energy ?? 0}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium text-gray-300">Determination</span>
            <span className={`text-sm font-bold text-purple-400`}>
              {dynamic_stats?.determination ?? 0}/100
            </span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-purple-500 h-2.5 rounded-full transition-all duration-300"
              style={{
                width: `${dynamic_stats?.determination ?? 0}%`
              }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium text-gray-300">Bond</span>
            <span className={`text-sm font-bold text-pink-400`}>
              {dynamic_stats?.bond ?? 0}/100
            </span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-pink-500 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${dynamic_stats?.bond ?? 0}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium text-gray-300">Fame</span>
            <span className={`text-sm font-bold text-purple-400`}>
              {dynamic_stats?.fame ?? 0}/100
            </span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-purple-500 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${dynamic_stats?.fame ?? 0}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium text-gray-300">Instinct</span>
            <span className={`text-sm font-bold text-cyan-400`}>
              {dynamic_stats?.instinct ?? 0}/100
            </span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-cyan-500 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${dynamic_stats?.instinct ?? 0}%` }}
            />
          </div>
        </div>
      </div>

      <div className="bg-gray-700/30 rounded-lg p-4">
        <h4 className="text-lg font-bold mb-3 text-white">Race Performance</h4>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <div className="text-gray-400">Total Races</div>
            <div className="text-white font-bold">{performance?.total_races ?? 0}</div>
          </div>
          <div>
            <div className="text-gray-400">Wins</div>
            <div className="text-green-400 font-bold">{performance?.total_wins ?? 0}</div>
          </div>
          <div>
            <div className="text-gray-400">Win Rate</div>
            <div className="text-white font-bold">{performance?.win_rate ?? 0}%</div>
          </div>
          <div>
            <div className="text-gray-400">Total Earnings</div>
            <div className="text-blue-400 font-bold">{(performance?.total_earnings ?? 0).toFixed(3)} SOL</div>
          </div>
          <div>
            <div className="text-gray-400">Avg Earnings</div>
            <div className="text-blue-400 font-bold">{(performance?.average_earnings ?? 0).toFixed(3)} SOL</div>
          </div>
        </div>
      </div>
    </div>
  );
}
