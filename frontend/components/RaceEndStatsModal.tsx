'use client';

import { useEffect, useState } from 'react';
import { FaBolt, FaUtensils, FaHeart, FaTrophy, FaBrain, FaDumbbell, FaTimes } from 'react-icons/fa';
import { GiWeightLiftingUp } from 'react-icons/gi';
import { racesApi } from '@/lib/api/features/races-client';
import { RaceEndStatsData, StatChange } from '@/types';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { toast } from '@/lib/toast';
import HorseCard from '@/components/HorseCard';

interface RaceEndStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  raceId: string;
}

interface StatRowProps {
  stat: StatChange;
  delay: number;
}

function StatRow({ stat, delay }: StatRowProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [animateValue, setAnimateValue] = useState(false);
  const [displayValue, setDisplayValue] = useState(stat.before);
  const { playStatDecrease, playStatIncrease } = useSoundEffects();

  const isDecrease = stat.change < 0;
  const isIncrease = stat.change > 0;
  const hasChange = stat.change !== 0;

  useEffect(() => {
    const showTimer = setTimeout(() => setIsVisible(true), delay);
    const animateTimer = setTimeout(() => {
      setAnimateValue(true);

      if (isDecrease) {
        playStatDecrease();
      } else if (isIncrease) {
        playStatIncrease();
      }

      const duration = 2000;
      const fps = 60;
      const frames = (duration / 1000) * fps;
      const increment = (stat.after - stat.before) / frames;
      let currentFrame = 0;

      const interval = setInterval(() => {
        currentFrame++;
        if (currentFrame >= frames) {
          setDisplayValue(stat.after);
          clearInterval(interval);
        } else {
          setDisplayValue(stat.before + (increment * currentFrame));
        }
      }, duration / frames);

      return () => clearInterval(interval);
    }, delay + 100);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(animateTimer);
    };
  }, [delay, stat, isDecrease, isIncrease, playStatDecrease, playStatIncrease]);

  const beforePercent = ((stat.before - stat.min) / (stat.max - stat.min)) * 100;
  const currentPercent = ((displayValue - stat.min) / (stat.max - stat.min)) * 100;

  const getBackgroundColor = (textColor: string): string => {
    const colorMap: Record<string, string> = {
      'text-yellow-400': '#facc15',
      'text-orange-400': '#fb923c',
      'text-pink-500': '#ec4899',
      'text-purple-400': '#c084fc',
      'text-cyan-400': '#22d3ee',
      'text-purple-500': '#a855f7',
      'text-green-400': '#4ade80',
    };
    return colorMap[textColor] || '#a855f7';
  };

  return (
    <div
      className={`transform transition-all duration-500 ${isVisible ? 'translate-x-0 opacity-100' : '-translate-x-8 opacity-0'
        }`}
    >
      <div className="flex items-center gap-4 mb-2">
        <div className={`text-xl ${stat.color}`}>{stat.icon}</div>
        <div className="flex-1 flex items-baseline justify-between">
          <span className="text-sm font-medium text-gray-300">{stat.name}</span>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-white tabular-nums">
              {Math.round(displayValue)}{stat.unit || ''}
            </span>
            {hasChange && (
              <span className={`text-xs font-semibold tabular-nums ${isDecrease ? 'text-red-400' : isIncrease ? 'text-emerald-400' : 'text-gray-400'
                }`}>
                ({stat.change > 0 ? '+' : ''}{stat.change}{stat.unit || ''})
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="relative h-2 bg-gray-700 rounded-full overflow-hidden ml-9 border border-gray-600">
        <div
          className="absolute left-0 top-0 h-full transition-all ease-out"
          style={{
            width: `${Math.min(100, Math.max(0, animateValue ? currentPercent : beforePercent))}%`,
            transitionDuration: animateValue ? '2000ms' : '0ms',
            backgroundColor: getBackgroundColor(stat.color)
          }}
        />
      </div>
    </div>
  );
}

export default function RaceEndStatsModal({ isOpen, onClose, raceId }: RaceEndStatsModalProps) {
  const [data, setData] = useState<RaceEndStatsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const { playModalOpen } = useSoundEffects();

  useEffect(() => {
    if (!isOpen) {
      setData(null);
      setIsLoading(true);
      setHasLoaded(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || hasLoaded) return;

    playModalOpen();

    const fetchStats = async () => {
      try {
        setIsLoading(true);
        const statsData = await racesApi.getMyHorseStatsAfterRace(raceId);
        setData(statsData);
        setHasLoaded(true);
      } catch (error) {
        toast.error('Failed to load race stats');
        onClose();
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, raceId]);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getPositionColor = (position: number) => {
    if (position === 1) return 'from-yellow-500/20 to-yellow-600/20 border-yellow-500/40 text-yellow-400';
    if (position === 2) return 'from-gray-400/20 to-gray-500/20 border-gray-400/40 text-gray-300';
    if (position === 3) return 'from-orange-500/20 to-orange-600/20 border-orange-500/40 text-orange-400';
    return 'from-purple-500/20 to-purple-600/20 border-purple-500/40 text-purple-400';
  };

  const getPositionIcon = (position: number) => {
    if (position === 1) return '🥇';
    if (position === 2) return '🥈';
    if (position === 3) return '🥉';
    return '🏁';
  };

  const buildStatChanges = (data: RaceEndStatsData): StatChange[] => {
    const getStatValue = (obj: any, key: string, fallback: number = 0): number => {
      const value = obj?.[key];
      return typeof value === 'number' ? value : fallback;
    };

    return [
      {
        name: 'Energy',
        icon: <FaBolt />,
        color: 'text-yellow-400',
        before: getStatValue(data.stats_before, 'energy'),
        after: getStatValue(data.stats_after, 'energy'),
        change: getStatValue(data.stat_changes, 'energy'),
        min: 0,
        max: 100,
      },
      {
        name: 'Satiety',
        icon: <FaUtensils />,
        color: 'text-orange-400',
        before: getStatValue(data.stats_before, 'satiety'),
        after: getStatValue(data.stats_after, 'satiety'),
        change: getStatValue(data.stat_changes, 'satiety'),
        min: 0,
        max: 100,
      },
      {
        name: 'Bond',
        icon: <FaHeart />,
        color: 'text-pink-500',
        before: getStatValue(data.stats_before, 'bond'),
        after: getStatValue(data.stats_after, 'bond'),
        change: getStatValue(data.stat_changes, 'bond'),
        min: 0,
        max: 100,
      },
      {
        name: 'Fame',
        icon: <FaTrophy />,
        color: 'text-purple-400',
        before: getStatValue(data.stats_before, 'fame'),
        after: getStatValue(data.stats_after, 'fame'),
        change: getStatValue(data.stat_changes, 'fame'),
        min: 0,
        max: 100,
      },
      {
        name: 'Instinct',
        icon: <FaBrain />,
        color: 'text-cyan-400',
        before: getStatValue(data.stats_before, 'instinct'),
        after: getStatValue(data.stats_after, 'instinct'),
        change: getStatValue(data.stat_changes, 'instinct'),
        min: 0,
        max: 100,
      },
      {
        name: 'Determination',
        icon: <FaDumbbell />,
        color: 'text-purple-500',
        before: getStatValue(data.stats_before, 'determination'),
        after: getStatValue(data.stats_after, 'determination'),
        change: getStatValue(data.stat_changes, 'determination'),
        min: 0,
        max: 100,
      },
      {
        name: 'Weight',
        icon: <GiWeightLiftingUp />,
        color: 'text-green-400',
        before: getStatValue(data.stats_before, 'weight', 500),
        after: getStatValue(data.stats_after, 'weight', 500),
        change: getStatValue(data.stat_changes, 'weight'),
        unit: 'kg',
        min: 300,
        max: 1000,
      },
    ];
  };

  return (
    <div
      className="fixed inset-0 top-[-80px] z-50 flex items-center justify-center bg-black/60 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md mx-4 bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-700/50 animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 w-8 h-8 flex items-center justify-center bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-full text-gray-400 hover:text-white transition-colors z-10"
          aria-label="Close"
        >
          <FaTimes className="text-sm" />
        </button>

        {isLoading ? (
          <div className="flex items-center justify-center p-24">
            <div className="w-10 h-10 border-3 border-purple-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : data ? (
          <div className="p-6">
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-gradient-to-r ${getPositionColor(data.position)} border backdrop-blur-sm mb-4`}>
              <span className="text-2xl">{getPositionIcon(data.position)}</span>
              <span className="font-bold text-sm">
                {data.position === 1 ? '1st' : data.position === 2 ? '2nd' : data.position === 3 ? '3rd' : `${data.position}th`} Place
              </span>
            </div>

            {data.reward_amount > 0 && (
              <div className="mb-4 px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
                <span className="text-emerald-400 font-bold text-lg">
                  +{Number(data.reward_amount).toFixed(3)} SOL
                </span>
              </div>
            )}

            <div className="mb-6 pb-6 border-b border-gray-700/50">
              <HorseCard horse={data.horse} density="minimal" />
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Performance</h3>
              {buildStatChanges(data).map((stat, index) => (
                <StatRow key={`${stat.name}-${index}`} stat={stat} delay={index * 150} />
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
