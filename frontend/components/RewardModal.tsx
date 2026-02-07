'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Confetti from 'react-confetti';
import { FaGift, FaTimes } from 'react-icons/fa';
import { GiHorseshoe } from 'react-icons/gi';
import { Reward, RewardType } from '@/types';

interface RewardModalProps {
  isOpen: boolean;
  onClose: () => void;
  reward: Omit<Reward, 'claimed_at' | 'user_id'> | null;
  onClaim?: (rewardId: string) => Promise<void>;
  showClaimButton?: boolean;
  autoCloseDelay?: number;
  customTitle?: string;
  customDescription?: string;
}

interface RewardConfig {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
  gradient: string;
}

const rewardConfigs: Record<RewardType, RewardConfig> = {
  welcome_box: {
    icon: <FaGift className="w-24 h-24" />,
    title: 'Welcome Gift!',
    description: 'Thank you for joining Pixel Race! Claim your free Level 1 Mystery Box and start your racing journey. This gift is completely FREE - we cover all Solana transaction fees!',
    color: 'text-pink-400',
    gradient: 'from-pink-500/20 to-purple-500/20',
  },
  goodluck: {
    icon: <GiHorseshoe className="w-24 h-24" />,
    title: 'Good Luck Charm!',
    description: 'Congratulations on your first race! Claim your Good Luck charm to boost your horses in future races.',
    color: 'text-green-400',
    gradient: 'from-green-500/20 to-emerald-500/20',
  },
  daily_login: {
    icon: <FaGift className="w-24 h-24" />,
    title: 'Daily Bonus!',
    description: 'Welcome back! Claim your daily login reward and keep your streak going.',
    color: 'text-blue-400',
    gradient: 'from-blue-500/20 to-cyan-500/20',
  },
  special_event: {
    icon: <FaGift className="w-24 h-24" />,
    title: 'Special Event Reward!',
    description: 'You earned a special event reward! Claim it before it expires.',
    color: 'text-yellow-400',
    gradient: 'from-yellow-500/20 to-orange-500/20',
  },
};

export default function RewardModal({
  isOpen,
  onClose,
  reward,
  onClaim,
  showClaimButton = true,
  autoCloseDelay = 0,
  customTitle,
  customDescription
}: RewardModalProps) {
  const [isClaiming, setIsClaiming] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });

      const handleResize = () => {
        setWindowSize({ width: window.innerWidth, height: window.innerHeight });
      };

      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      setShowConfetti(true);
      const confettiTimer = setTimeout(() => setShowConfetti(false), 5000);

      document.body.style.overflow = 'hidden';

      let autoCloseTimer: NodeJS.Timeout | null = null;
      if (autoCloseDelay > 0 && !showClaimButton) {
        autoCloseTimer = setTimeout(() => {
          onClose();
        }, autoCloseDelay);
      }

      return () => {
        clearTimeout(confettiTimer);
        if (autoCloseTimer) clearTimeout(autoCloseTimer);
        document.body.style.overflow = 'unset';
      };
    }
  }, [isOpen, autoCloseDelay, showClaimButton, onClose]);

  if (!reward) return null;

  const config = rewardConfigs[reward.reward_type];

  const handleClaim = async () => {
    if (!onClaim) return;

    setIsClaiming(true);
    try {
      await onClaim(reward.id);
      setTimeout(() => {
        onClose();
      }, 1000);
    } finally {
      setIsClaiming(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {showConfetti && (
            <Confetti
              width={windowSize.width}
              height={windowSize.height}
              recycle={false}
              numberOfPieces={500}
              gravity={0.3}
            />
          )}

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.5, opacity: 0, y: 50 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              className="relative w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={onClose}
                className="absolute -top-4 -right-4 z-10 p-2 bg-gray-800 rounded-full hover:bg-gray-700 transition-colors shadow-lg"
              >
                <FaTimes className="w-5 h-5 text-white" />
              </button>

              <div className={`
                relative overflow-hidden
                bg-gradient-to-br ${config.gradient}
                border border-white/10
                rounded-2xl shadow-2xl
                backdrop-blur-xl
              `}>
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-blue-500/10 animate-pulse" />

                <div className="relative p-8 text-center">
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.2, type: 'spring', damping: 10 }}
                    className={`mx-auto mb-6 ${config.color}`}
                  >
                    {config.icon}
                  </motion.div>

                  <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-3xl font-bold text-white mb-4"
                    dangerouslySetInnerHTML={{ __html: customTitle || config.title }}
                  />

                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-gray-300 mb-6 leading-relaxed"
                  >
                    {customDescription || config.description}
                  </motion.p>

                  {reward.reward_type === 'welcome_box' && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.5 }}
                      className="mb-8 p-4 rounded-xl bg-green-500/10 border border-green-500/30"
                    >
                      <div className="flex items-center justify-center gap-2 text-green-400 text-sm font-semibold">
                        <span className="text-xl">✨</span>
                        <span>100% FREE - No transaction fees required!</span>
                        <span className="text-xl">✨</span>
                      </div>
                    </motion.div>
                  )}

                  {showClaimButton ? (
                    <motion.button
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleClaim}
                      disabled={isClaiming}
                      className={`
                        w-full py-4 px-8 rounded-xl
                        bg-gradient-to-r from-pink-500 to-purple-600
                        text-white font-bold text-lg
                        shadow-lg shadow-pink-500/50
                        transition-all duration-300
                        hover:shadow-xl hover:shadow-pink-500/60
                        disabled:opacity-50 disabled:cursor-not-allowed
                        relative overflow-hidden
                      `}
                    >
                      {isClaiming ? (
                        <span className="flex items-center justify-center">
                          <motion.span
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                            className="inline-block mr-2"
                          >
                            ⏳
                          </motion.span>
                          Claiming...
                        </span>
                      ) : (
                        'Claim Reward'
                      )}

                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                        animate={{ x: ['-100%', '200%'] }}
                        transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                      />
                    </motion.button>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                      className={`
                        w-full py-4 px-8 rounded-xl
                        bg-gradient-to-r from-green-500 to-emerald-600
                        text-white font-bold text-lg
                        shadow-lg shadow-green-500/50
                        relative overflow-hidden
                      `}
                    >
                      <span className="flex items-center justify-center">
                        <span className="mr-2">✅</span>
                        Reward Received!
                      </span>

                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                        animate={{ x: ['-100%', '200%'] }}
                        transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                      />
                    </motion.div>
                  )}
                </div>

                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500" />
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
