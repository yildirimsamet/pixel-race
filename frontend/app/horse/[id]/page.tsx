'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useWallet } from '@solana/wallet-adapter-react';
import { horses as horsesApi, races as racesApi } from '@/lib/api';
import { Horse, HorseStatsDetailResponse, RaceResult } from '@/types';
import Loader from '@/components/Loader';
import { IoArrowBack, IoCopy, IoCheckmark, IoTrophy, IoFlash, IoTime } from 'react-icons/io5';
import { FaAppleAlt, FaDumbbell, FaWeight, FaHeart, FaBolt, FaFire, FaBrain } from 'react-icons/fa';
import { GiHorseshoe, GiTrophy } from 'react-icons/gi';
import { toast } from '@/lib/toast';
import { useTransaction } from '@/hooks/useTransaction';
import { createHorseFeedTransaction, createHorseRestTransaction, createHorseTrainTransaction } from '@/lib/solana-transactions';
import { HORSE_FEED_PRICE, HORSE_REST_PRICE, HORSE_TRAIN_PRICE, TREASURY_WALLET } from '@/lib/constants';
import { getUserFriendlyError } from '@/lib/error-messages';

export default function HorseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const horseId = params.id as string;

  const { publicKey } = useWallet();
  const { sendSolTransaction } = useTransaction();

  const [horse, setHorse] = useState<Horse | null>(null);
  const [stats, setStats] = useState<HorseStatsDetailResponse | null>(null);
  const [raceHistory, setRaceHistory] = useState<RaceResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<'feed' | 'rest' | 'train' | null>(null);
  const [copiedAddress, setCopiedAddress] = useState(false);

  useEffect(() => {
    loadHorseData();
  }, [horseId]);

  const loadHorseData = async () => {
    try {
      setLoading(true);

      const allHorses = await horsesApi.getAll();
      const foundHorse = allHorses.find((h: Horse) => h.id === horseId);

      if (!foundHorse) {
        toast.error('Horse not found');
        router.push('/stable');
        return;
      }

      setHorse(foundHorse);

      const [horseStats, allRaces] = await Promise.all([
        horsesApi.getStats(horseId),
        racesApi.getAll('done')
      ]);

      setStats(horseStats);

      const horseRaces: RaceResult[] = [];
      for (const race of allRaces) {
        try {
          const results = await racesApi.getResults(race.id);
          const horseResult = results.find(r => r.horse_id === horseId);
          if (horseResult) {
            horseRaces.push(horseResult);
          }
        } catch (err) {
          console.error('Error fetching race results:', err);
        }
      }

      horseRaces.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setRaceHistory(horseRaces.slice(0, 5));

      setLoading(false);
    } catch (error: any) {
      toast.error('Failed to load horse details');
      console.error('Failed to load horse:', error);
      setLoading(false);
      router.push('/stable');
    }
  };

  const refreshStats = async () => {
    try {
      const horseStats = await horsesApi.getStats(horseId);
      setStats(horseStats);

      const allHorses = await horsesApi.getAll();
      const foundHorse = allHorses.find((h: Horse) => h.id === horseId);
      if (foundHorse) {
        setHorse(foundHorse);
      }
    } catch (error: any) {
      console.error('Failed to refresh stats:', error);
    }
  };

  const handleFeed = async () => {
    if (actionLoading || !publicKey || !stats) return;

    if (stats.dynamic_stats.satiety >= 100) {
      toast.info('Horse is already full');
      return;
    }

    if (horse?.in_race) {
      toast.error('Cannot feed horse while in race');
      return;
    }

    try {
      setActionLoading('feed');
      const tx = await createHorseFeedTransaction(publicKey, TREASURY_WALLET);
      const signature = await sendSolTransaction(tx);

      if (signature) {
        await horsesApi.feedHorse(horseId, signature);
        await refreshStats();
        toast.success('Horse fed successfully');
      }
    } catch (error: any) {
      console.error('Feed error:', error);
      toast.error(getUserFriendlyError(error, 'Failed to feed horse'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleRest = async () => {
    if (actionLoading || !publicKey || !stats) return;

    if (stats.dynamic_stats.energy >= 100) {
      toast.info('Horse is already fully rested');
      return;
    }

    if (horse?.in_race) {
      toast.error('Cannot rest horse while in race');
      return;
    }

    try {
      setActionLoading('rest');
      const tx = await createHorseRestTransaction(publicKey, TREASURY_WALLET);
      const signature = await sendSolTransaction(tx);

      if (signature) {
        await horsesApi.restHorse(horseId, signature);
        await refreshStats();
        toast.success('Horse rested successfully');
      }
    } catch (error: any) {
      console.error('Rest error:', error);
      toast.error(getUserFriendlyError(error, 'Failed to rest horse'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleTrain = async () => {
    if (actionLoading || !publicKey || !stats) return;

    if (stats.dynamic_stats.determination >= 100) {
      toast.info('Horse has max determination');
      return;
    }

    if (horse?.in_race) {
      toast.error('Cannot train horse while in race');
      return;
    }

    try {
      setActionLoading('train');
      const tx = await createHorseTrainTransaction(publicKey, TREASURY_WALLET);
      const signature = await sendSolTransaction(tx);

      if (signature) {
        const result = await horsesApi.trainHorse(horseId, signature);
        await refreshStats();

        if (result.success) {
          toast.success(result.message);
        } else {
          toast.warning(result.message);
        }
      }
    } catch (error: any) {
      console.error('Train error:', error);
      toast.error(getUserFriendlyError(error, 'Failed to train horse'));
    } finally {
      setActionLoading(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAddress(true);
    toast.success('Address copied to clipboard');
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  const getStatColor = (value: number): string => {
    if (value >= 70) return 'bg-gradient-to-r from-green-500 to-emerald-500';
    if (value >= 40) return 'bg-gradient-to-r from-yellow-500 to-orange-500';
    return 'bg-gradient-to-r from-red-500 to-rose-500';
  };

  const getStatTextColor = (value: number): string => {
    if (value >= 70) return 'text-green-400';
    if (value >= 40) return 'text-yellow-400';
    return 'text-red-400';
  };

  const calculateSpeedScore = (stats: HorseStatsDetailResponse): number => {
    return stats?.dynamic_stats?.speed_score || 0;
  };

  const getSpeedScoreColor = (score: number): string => {
    if (score >= 80) return 'text-purple-400';
    if (score >= 60) return 'text-blue-400';
    if (score >= 40) return 'text-green-400';
    if (score >= 20) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getSpeedScoreGradient = (score: number): string => {
    if (score >= 80) return 'from-purple-500 to-pink-500';
    if (score >= 60) return 'from-blue-500 to-cyan-500';
    if (score >= 40) return 'from-green-500 to-emerald-500';
    if (score >= 20) return 'from-yellow-500 to-orange-500';
    return 'from-red-500 to-rose-500';
  };

  if (loading) {
    return <Loader text="Loading horse details..." />;
  }

  if (!horse || !stats) {
    return null;
  }

  const speedScore = calculateSpeedScore(stats);
  const winRate = stats.performance.win_rate || 0;

  return (
    <div className="min-h-screen pb-12 animate-fade-in">
      <button
        onClick={() => router.push('/stable')}
        className="mb-6 inline-flex items-center gap-2 px-4 py-2 bg-gray-800/60 hover:bg-gray-700/60 backdrop-blur-sm rounded-lg border border-gray-700 transition-all duration-200 group"
        aria-label="Back to stable"
      >
        <IoArrowBack className="text-lg group-hover:-translate-x-1 transition-transform" />
        <span className="text-gray-300">Back to Stable</span>
      </button>

      <div className="relative bg-gradient-to-br from-gray-900/80 via-gray-800/80 to-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-700/50 shadow-2xl overflow-hidden mb-8">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5" />

        <div className="relative px-8 py-10">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div
              className="text-8xl leading-none transform hover:scale-110 transition-transform duration-300 horse-animated"
              style={{
                color: horse.color || '#ffffff',
                filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.6))',
                fontFamily: "'Muybridge', 'Apple Color Emoji', 'Segoe UI Emoji', sans-serif",
              }}
            >
              🐎
            </div>

            <div className="flex-1">
              <div className="flex items-start gap-3 mb-3">
                <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
                  {horse.name || 'Unnamed Horse'}
                </h1>
                {horse.nft_mint_address && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-full text-purple-300 text-sm font-medium">
                    <span className="text-lg">🌟</span>
                    NFT
                  </span>
                )}
                {horse.in_race && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-full text-yellow-300 text-sm font-medium animate-pulse">
                    <span className="text-lg">🏁</span>
                    Racing
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-6 mb-6">
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">Age:</span>
                  <span className="text-xl font-bold text-white">{stats.base_stats.age} years</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">Level:</span>
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30 rounded-full text-blue-300 text-lg font-bold">
                    {stats.dynamic_stats.level}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="relative">
                  <svg className="transform -rotate-90 w-28 h-28">
                    <circle
                      cx="56"
                      cy="56"
                      r="48"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      className="text-gray-700/50"
                    />
                    <circle
                      cx="56"
                      cy="56"
                      r="48"
                      stroke="url(#speedGradient)"
                      strokeWidth="8"
                      fill="none"
                      strokeDasharray={`${(speedScore / 100) * 301.6} 301.6`}
                      strokeLinecap="round"
                      className="transition-all duration-1000"
                    />
                    <defs>
                      <linearGradient id="speedGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" className={`${getSpeedScoreGradient(speedScore).split(' ')[0].replace('from-', 'text-')}`} stopColor="currentColor" />
                        <stop offset="100%" className={`${getSpeedScoreGradient(speedScore).split(' ')[1].replace('to-', 'text-')}`} stopColor="currentColor" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className={`text-3xl font-bold ${getSpeedScoreColor(speedScore)}`}>
                      {speedScore}
                    </div>
                    <div className="text-xs text-gray-400 uppercase tracking-wider">Speed</div>
                  </div>
                </div>

                <div className="text-gray-300 text-sm leading-relaxed">
                  <div className="flex items-center gap-2 mb-1">
                    <IoFlash className="text-yellow-400" />
                    <span>Speed score determines race performance</span>
                  </div>
                  <div className="text-gray-500">Based on stats, age, and condition</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-8">
          <div className="bg-gray-800/60 backdrop-blur-sm rounded-xl border border-gray-700/50 shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-gray-800 to-gray-700/50 px-6 py-4 border-b border-gray-700">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <FaHeart className="text-red-400" />
                Vital Stats
              </h2>
            </div>

            <div className="p-6 space-y-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FaBolt className="text-blue-400 text-lg" />
                    <span className="text-lg font-medium text-gray-200">Energy</span>
                  </div>
                  <span className={`text-2xl font-bold ${getStatTextColor(stats.dynamic_stats.energy)}`}>
                    {stats.dynamic_stats.energy}
                  </span>
                </div>
                <div className="w-full h-3 bg-gray-700/50 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${getStatColor(stats.dynamic_stats.energy)} transition-all duration-500`}
                    style={{ width: `${stats.dynamic_stats.energy}%` }}
                  />
                </div>
                <button
                  onClick={handleRest}
                  disabled={!publicKey || stats.dynamic_stats.energy >= 100 || horse.in_race || actionLoading !== null}
                  className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {actionLoading === 'rest' && (
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  )}
                  {actionLoading === 'rest' ? 'Resting...' : `Rest Horse (${HORSE_REST_PRICE} SOL)`}
                </button>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FaAppleAlt className="text-green-400 text-lg" />
                    <span className="text-lg font-medium text-gray-200">Satiety</span>
                  </div>
                  <span className={`text-2xl font-bold ${getStatTextColor(stats.dynamic_stats.satiety)}`}>
                    {stats.dynamic_stats.satiety}
                  </span>
                </div>
                <div className="w-full h-3 bg-gray-700/50 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${getStatColor(stats.dynamic_stats.satiety)} transition-all duration-500`}
                    style={{ width: `${stats.dynamic_stats.satiety}%` }}
                  />
                </div>
                <button
                  onClick={handleFeed}
                  disabled={!publicKey || stats.dynamic_stats.satiety >= 100 || horse.in_race || actionLoading !== null}
                  className="w-full px-4 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {actionLoading === 'feed' && (
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  )}
                  {actionLoading === 'feed' ? 'Feeding...' : `Feed Horse (${HORSE_FEED_PRICE} SOL)`}
                </button>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FaDumbbell className="text-purple-400 text-lg" />
                    <span className="text-lg font-medium text-gray-200">Determination</span>
                  </div>
                  <span className="text-2xl font-bold text-purple-400">
                    {stats.dynamic_stats.determination}
                  </span>
                </div>
                <div className="w-full h-3 bg-gray-700/50 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
                    style={{ width: `${stats.dynamic_stats.determination}%` }}
                  />
                </div>
                <button
                  onClick={handleTrain}
                  disabled={!publicKey || stats.dynamic_stats.determination >= 100 || horse.in_race || actionLoading !== null}
                  className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {actionLoading === 'train' && (
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  )}
                  {actionLoading === 'train' ? 'Training...' : `Train Horse (${HORSE_TRAIN_PRICE} SOL)`}
                </button>
                {stats.dynamic_stats.determination < 100 && (
                  <p className="text-yellow-400 text-sm flex items-center gap-2">
                    <IoFlash className="text-xs" />
                    35% success chance - determination increases randomly
                  </p>
                )}
              </div>

              <div className="pt-4 border-t border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <FaWeight className="text-gray-400" />
                    <span className="text-gray-300">Weight</span>
                  </div>
                  <span className="text-lg font-bold text-white">{stats.dynamic_stats.weight.toFixed(1)} kg</span>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FaHeart className="text-pink-400 text-lg" />
                      <span className="text-lg font-medium text-gray-200">Bond</span>
                    </div>
                    <span className="text-2xl font-bold text-pink-400">
                      {stats.dynamic_stats?.bond ?? 0}
                    </span>
                  </div>
                  <div className="w-full h-3 bg-gray-700/50 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-pink-500 to-pink-600 transition-all duration-500"
                      style={{ width: `${stats.dynamic_stats?.bond ?? 0}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-400">Increases by 2 after each race</p>
                </div>

                <div className="space-y-3 mt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <GiTrophy className="text-purple-400 text-lg" />
                      <span className="text-lg font-medium text-gray-200">Fame</span>
                    </div>
                    <span className="text-2xl font-bold text-purple-400">
                      {stats.dynamic_stats?.fame ?? 0}
                    </span>
                  </div>
                  <div className="w-full h-3 bg-gray-700/50 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-purple-600 transition-all duration-500"
                      style={{ width: `${stats.dynamic_stats?.fame ?? 0}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-400">+3 for 1st, +2 for 2nd, +1 for 3rd place</p>
                </div>

                <div className="space-y-3 mt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FaBrain className="text-cyan-400 text-lg" />
                      <span className="text-lg font-medium text-gray-200">Instinct</span>
                    </div>
                    <span className="text-2xl font-bold text-cyan-400">
                      {stats.dynamic_stats?.instinct ?? 0}
                    </span>
                  </div>
                  <div className="w-full h-3 bg-gray-700/50 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 to-cyan-600 transition-all duration-500"
                      style={{ width: `${stats.dynamic_stats?.instinct ?? 0}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-400">25% chance to increase by 2 after each race</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-800/60 backdrop-blur-sm rounded-xl border border-gray-700/50 shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-gray-800 to-gray-700/50 px-6 py-4 border-b border-gray-700">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <IoTrophy className="text-yellow-400" />
                Performance
              </h2>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-xl p-4 text-center">
                  <div className="text-3xl font-bold text-blue-400">{stats.performance.total_races}</div>
                  <div className="text-sm text-gray-400 mt-1">Total Races</div>
                </div>

                <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-xl p-4 text-center">
                  <div className="text-3xl font-bold text-green-400">{stats.performance.total_wins}</div>
                  <div className="text-sm text-gray-400 mt-1">Victories</div>
                </div>

                <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-xl p-4 text-center">
                  <div className="text-3xl font-bold text-purple-400">{winRate.toFixed(1)}%</div>
                  <div className="text-sm text-gray-400 mt-1">Win Rate</div>
                </div>

                <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-xl p-4 text-center">
                  <div className="text-3xl font-bold text-yellow-400">{stats.performance.total_earnings.toFixed(3)}</div>
                  <div className="text-sm text-gray-400 mt-1">Total SOL</div>
                </div>
              </div>

              {stats.performance.total_races > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-700">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Average Earnings</span>
                    <span className="text-lg font-bold text-white">{stats.performance.average_earnings.toFixed(4)} SOL</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {stats.performance.total_races > 0 && raceHistory.length > 0 ? (
            <div className="bg-gray-800/60 backdrop-blur-sm rounded-xl border border-gray-700/50 shadow-xl overflow-hidden">
              <div className="bg-gradient-to-r from-gray-800 to-gray-700/50 px-6 py-4 border-b border-gray-700">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <FaFire className="text-orange-400" />
                  Recent Races
                </h2>
              </div>

              <div className="p-6 space-y-4">
                {raceHistory.map((result, index) => (
                  <div
                    key={result.id}
                    className="relative bg-gray-700/30 rounded-lg p-4 border border-gray-600/50 hover:border-gray-500/50 transition-all duration-200"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        {result.finish_position === 1 && (
                          <span className="text-3xl">🥇</span>
                        )}
                        {result.finish_position === 2 && (
                          <span className="text-3xl">🥈</span>
                        )}
                        {result.finish_position === 3 && (
                          <span className="text-3xl">🥉</span>
                        )}
                        {result.finish_position && result.finish_position > 3 && (
                          <span className="text-2xl text-gray-500">#{result.finish_position}</span>
                        )}
                        <div>
                          <div className="text-sm text-gray-400">
                            {new Date(result.created_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </div>
                          {result.finish_time_ms && (
                            <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                              <IoTime />
                              {(result.finish_time_ms / 1000).toFixed(2)}s
                            </div>
                          )}
                        </div>
                      </div>

                      {result.reward_amount && result.reward_amount > 0 && (
                        <div className="text-right">
                          <div className="text-lg font-bold text-green-400">
                            +{result.reward_amount.toFixed(3)} SOL
                          </div>
                          <div className="text-xs text-gray-500">Reward</div>
                        </div>
                      )}
                    </div>

                    {result.goodluck_used && (
                      <div className="mt-2 inline-flex items-center gap-1 px-2 py-1 bg-purple-500/20 border border-purple-500/30 rounded text-purple-300 text-xs">
                        <span><GiHorseshoe className="w-2 h-2 text-neon-green" /></span>
                        Good Luck Used
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-gray-800/60 backdrop-blur-sm rounded-xl border border-gray-700/50 shadow-xl overflow-hidden">
              <div className="bg-gradient-to-r from-gray-800 to-gray-700/50 px-6 py-4 border-b border-gray-700">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <FaFire className="text-orange-400" />
                  Race History
                </h2>
              </div>
              <div className="p-12 text-center">
                <div className="text-6xl mb-4">🏇</div>
                <h3 className="text-xl font-semibold text-gray-300 mb-2">No Races Yet</h3>
                <p className="text-gray-500 mb-6">This horse hasn't participated in any races</p>
                <button
                  onClick={() => router.push('/races')}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-semibold rounded-lg transition-all duration-200"
                >
                  Join a Race
                  <IoFlash />
                </button>
              </div>
            </div>
          )}

          <div className="bg-gray-800/60 backdrop-blur-sm rounded-xl border border-gray-700/50 shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-gray-800 to-gray-700/50 px-6 py-4 border-b border-gray-700">
              <h2 className="text-2xl font-bold text-white">Horse Details</h2>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-gray-700/50">
                <span className="text-gray-400">Birthdate</span>
                <span className="text-white font-medium">
                  {new Date(stats.base_stats.birthdate).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </span>
              </div>

              <div className="flex items-center justify-between py-3 border-b border-gray-700/50">
                <span className="text-gray-400">Color</span>
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-full border-2 border-gray-600 shadow-lg"
                    style={{ backgroundColor: horse.color }}
                  />
                  <span className="text-white font-mono">{horse.color}</span>
                </div>
              </div>

              <div className="flex items-center justify-between py-3 border-b border-gray-700/50">
                <span className="text-gray-400">Registered</span>
                <span className="text-white font-medium">
                  {new Date(horse.created_at).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </span>
              </div>

              {horse.nft_mint_address && (
                <div className="pt-4">
                  <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xl">🌟</span>
                      <span className="text-purple-300 font-semibold">NFT Information</span>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <div className="text-xs text-gray-400 mb-1">Mint Address</div>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 text-xs text-purple-300 font-mono bg-black/20 px-2 py-1 rounded overflow-x-auto">
                            {horse.nft_mint_address}
                          </code>
                          <button
                            onClick={() => copyToClipboard(horse.nft_mint_address!)}
                            className="p-2 hover:bg-purple-500/20 rounded transition-colors"
                            aria-label="Copy address"
                          >
                            {copiedAddress ? (
                              <IoCheckmark className="text-green-400" />
                            ) : (
                              <IoCopy className="text-purple-300" />
                            )}
                          </button>
                        </div>
                      </div>

                      <a
                        href={`https://explorer.solana.com/address/${horse.nft_mint_address}?cluster=devnet`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors text-sm font-medium w-full justify-center"
                      >
                        View on Solana Explorer
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
