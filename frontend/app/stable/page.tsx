'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { horses as horsesApi, users } from '@/lib/api';
import { Horse, User } from '@/types';
import HorseCard from '@/components/HorseCard';
import HeroHeader from '@/components/HeroHeader';
import EmptyState from '@/components/EmptyState';
import Loader from '@/components/Loader';
import { GiHorseHead, GiTrophy, GiTwoCoins } from 'react-icons/gi';
import { FaWallet } from 'react-icons/fa';
import { TbSparkles } from 'react-icons/tb';
import { MdCardGiftcard } from 'react-icons/md';
import { useWallet } from '@solana/wallet-adapter-react';
import { useSolBalance } from '@/hooks/useTransaction';
import { toast } from '@/lib/toast';
import Link from 'next/link';

export default function StablePage() {
  const [horses, setHorses] = useState<Horse[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const { publicKey, connected } = useWallet();
  const { balance: solBalance, fetchBalance } = useSolBalance();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (connected) {
      fetchBalance();
    }
  }, [connected, fetchBalance]);

  const loadData = useCallback(async () => {
    try {
      const [horsesData, userData] = await Promise.all([
        horsesApi.getAll(),
        users.getMe()
      ]);

      const horsesWithStats = await Promise.all(
        horsesData.map(async (horse: Horse) => {
          try {
            const statsData = await horsesApi.getStats(horse.id);
            return {
              ...horse,
              stats: statsData.dynamic_stats || null,
              statistics: statsData.performance ? {
                total_races: statsData.performance.total_races,
                total_wins: statsData.performance.total_wins,
                total_earnings: statsData.performance.total_earnings
              } : null
            };
          } catch {
            return horse;
          }
        })
      );

      setHorses(horsesWithStats);
      setUser(userData);
    } catch (error: any) {
      toast.error('Failed to load stable data');
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-16rem)]">
        <Loader text="Loading your stable..." />
      </div>
    );
  }

  const totalRaces = horses.reduce((sum, h) => sum + (h.statistics?.total_races || 0), 0);
  const totalWins = horses.reduce((sum, h) => sum + (h.statistics?.total_wins || 0), 0);
  const totalEarnings = horses.reduce((sum, h) => sum + (h.statistics?.total_earnings || 0), 0);

  return (
    <div className="space-y-8 animate-fade-in min-h-screen">
      <HeroHeader
        icon={<GiHorseHead />}
        title={
          <span className="bg-gradient-to-r from-neon-blue via-neon-green to-neon-purple bg-clip-text text-transparent">
            My Champions
          </span>
        }
        subtitle="Your racing champions ready to compete"
        action={
          connected && (
            <div className="glass rounded-xl px-6 py-3 border border-purple-500/30">
              <div className="flex items-center gap-3">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <FaWallet className="text-purple-400 text-2xl" />
                </motion.div>
                <div>
                  <p className="text-xs text-gray-400">Your Balance</p>
                  <p className="text-2xl font-bold text-purple-400">
                    {solBalance !== null ? solBalance.toFixed(4) : '-.----'} SOL
                  </p>
                </div>
              </div>
            </div>
          )
        }
      />

      {horses.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <div className="glass rounded-2xl p-6 border border-neon-blue/30 bg-gradient-to-br from-blue-500/10 to-cyan-500/10">
            <div className="flex items-center gap-4">
              <motion.div
                className="p-4 rounded-full bg-neon-blue/20"
              >
                <GiHorseHead className="text-4xl text-neon-blue" />
              </motion.div>
              <div>
                <p className="text-sm text-gray-400 mb-1">Total Champions</p>
                <p className="text-3xl font-bold text-neon-blue">{horses.length}</p>
              </div>
            </div>
          </div>

          <div className="glass rounded-2xl p-6 border border-neon-green/30 bg-gradient-to-br from-green-500/10 to-emerald-500/10">
            <div className="flex items-center gap-4">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="p-4 rounded-full bg-neon-green/20"
              >
                <GiTrophy className="text-4xl text-neon-green" />
              </motion.div>
              <div>
                <p className="text-sm text-gray-400 mb-1">Total Wins</p>
                <p className="text-3xl font-bold text-neon-green">{totalWins}</p>
                <p className="text-xs text-gray-500">{totalRaces} races</p>
              </div>
            </div>
          </div>

          <div className="glass rounded-2xl p-6 border border-neon-purple/30 bg-gradient-to-br from-purple-500/10 to-pink-500/10">
            <div className="flex items-center gap-4">
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                className="p-4 rounded-full bg-neon-purple/20"
              >
                <GiTwoCoins className="text-4xl text-neon-purple" />
              </motion.div>
              <div>
                <p className="text-sm text-gray-400 mb-1">Total Earnings</p>
                <p className="text-3xl font-bold text-neon-purple">{totalEarnings.toFixed(4)}</p>
                <p className="text-xs text-gray-500">SOL</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {horses.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <EmptyState
            icon={
              <motion.div
                animate={{ y: [0, -20, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              >
                <GiHorseHead className="text-8xl text-gray-600" />
              </motion.div>
            }
            title="No Champions Yet"
            description="Your stable is empty. Start your racing journey by opening a mystery box!"
            action={
              <Link href="/mystery-box">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="mt-6 px-8 py-4 rounded-2xl font-bold text-lg flex items-center gap-3 mx-auto"
                  style={{
                    background: 'linear-gradient(135deg, #a855f7, #ec4899, #f59e0b)',
                    boxShadow: '0 0 30px rgba(168, 85, 247, 0.5)',
                  }}
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  >
                    <MdCardGiftcard className="text-2xl" />
                  </motion.div>
                  <span>Open Mystery Box</span>
                  <TbSparkles className="text-2xl" />
                </motion.button>
              </Link>
            }
          />
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <h2 className="text-3xl font-bold">Your Horses</h2>
            </div>

            <Link href="/mystery-box">
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(168, 85, 247, 0.6)' }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-3 rounded-xl font-bold flex items-center gap-2 border-2 border-purple-500/50"
                style={{
                  background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.2), rgba(236, 72, 153, 0.2))',
                }}
              >
                <MdCardGiftcard className="text-xl" />
                <span>Get More Horses</span>
              </motion.button>
            </Link>
          </div>

          {[
            { level: 3, title: 'Gold Elite', subtitle: 'The Champions', icon: '🥇', gradient: 'from-yellow-400 to-yellow-600', border: 'border-yellow-500/30' },
            { level: 2, title: 'Silver Advanced', subtitle: 'Rising Stars', icon: '🥈', gradient: 'from-gray-400 to-gray-600', border: 'border-gray-400/30' },
            { level: 1, title: 'Bronze Starter', subtitle: 'Promising Racers', icon: '🥉', gradient: 'from-orange-500 to-amber-600', border: 'border-orange-500/30' }
          ].map(({ level, title, subtitle, icon, gradient, border }) => {
            const levelHorses = horses.filter(h => (h.stats?.level ?? 1) === level);

            if (levelHorses.length === 0) return null;

            return (
              <motion.div
                key={level}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="mb-12"
              >
                <div className={`mb-6 pb-4 border-b-2 ${border}`}>
                  <div className="flex items-center gap-4">
                    <motion.div
                      animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 3, repeat: Infinity }}
                      className={`text-4xl bg-gradient-to-r ${gradient} p-4 rounded-full bg-clip-text`}
                    >
                      {icon}
                    </motion.div>
                    <div>
                      <h3 className={`text-2xl font-bold bg-gradient-to-r ${gradient} bg-clip-text text-transparent`}>
                        {title}
                      </h3>
                      <p className="text-sm text-gray-400">{subtitle} ({levelHorses.length} horses)</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {levelHorses.map((horse, index) => (
                    <motion.div
                      key={horse.id}
                      initial={{ opacity: 0, y: 20, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ delay: index * 0.08, duration: 0.4, type: 'spring' }}
                    >
                      <HorseCard
                        horse={horse}
                        density="detailed"
                        showNFT={true}
                        showPerformance={true}
                        onNFTClick={() => {}}
                      />
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
