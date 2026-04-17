'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { users } from '@/lib/api';
import { User, HorseBuyResponse } from '@/types';
import MysteryBox from '@/components/MysteryBox';
import Loader from '@/components/Loader';
import LoginPrompt from '@/components/LoginPrompt';
import LockedTier4Card from '@/components/token/LockedTier4Card';
import { MdCardGiftcard } from 'react-icons/md';
import { FaWallet } from 'react-icons/fa';
import { SiSolana } from 'react-icons/si';
import { useWallet } from '@solana/wallet-adapter-react';
import { getHorsePrice, HORSE_PRICES } from '@/lib/solana-transactions';
import { formatSOLWithSymbol } from '@/lib/solana-fees';
import BalanceWarning from '@/components/BalanceWarning';
import { TOAST_MESSAGES } from '@/lib/toast-messages';
import { useHorsePurchase } from '@/hooks/useHorsePurchase';
import { useTransaction, useSolBalance } from '@/hooks/useTransaction';

export default function MysteryBoxPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);

  const { connected } = useWallet();
  const { estimatedFee } = useTransaction();
  const { balance: solBalance } = useSolBalance();
  const {
    purchaseHorse,
    isLoading: txLoading,
    selectedLevel,
    showBalanceWarning,
    setShowBalanceWarning,
  } = useHorsePurchase();

  const loadUserData = useCallback(async () => {
    if (!connected) {
      setLoading(false);
      return;
    }

    try {
      const userData = await users.getMe();
      setUser(userData);
    } catch (error: any) {
      console.error('Failed to load user data:', error);
    } finally {
      setLoading(false);
    }
  }, [connected]);

  useEffect(() => {
    loadUserData();
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setReducedMotion(true);
    }
  }, [loadUserData]);

  const handleBuyBox = useCallback(
    async (level: number): Promise<HorseBuyResponse> => {
      if (!connected) {
        TOAST_MESSAGES.WALLET_NOT_CONNECTED();
        throw new Error('Wallet not connected');
      }

      return purchaseHorse(level);
    },
    [connected, purchaseHorse]
  );

  return (
    <div className="min-h-screen relative overflow-hidden pb-16">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {!reducedMotion && (
          <>
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 rounded-full bg-white/30"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
                animate={{
                  opacity: [0, 0.6, 0],
                  scale: [0, 1.5, 0],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  delay: Math.random() * 3,
                }}
              />
            ))}
          </>
        )}
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex justify-center mb-6"
          >
            <div className="relative">
              <MdCardGiftcard
                className="text-8xl"
                style={{
                  background: 'linear-gradient(135deg, #10b981, #3b82f6, #a855f7)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              />
              {!reducedMotion && (
                <div
                  className="absolute inset-0 blur-2xl opacity-30"
                  style={{
                    background: 'radial-gradient(circle, #a855f7, transparent)',
                  }}
                />
              )}
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-5xl md:text-6xl font-black mb-4"
            style={{
              background: 'linear-gradient(135deg, #10b981, #3b82f6, #a855f7)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            MYSTERY HORSE BOXES
          </motion.h1>
        </div>

        {showBalanceWarning && selectedLevel !== null && solBalance !== null && estimatedFee !== null && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <BalanceWarning
              currentBalance={solBalance}
              requiredAmount={getHorsePrice(selectedLevel)}
              estimatedFee={estimatedFee}
              network={process.env.NEXT_PUBLIC_SOLANA_NETWORK}
            />
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-center"
        >
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full border-2 border-purple-500/30 bg-purple-500/5 mb-12">
            <SiSolana className="text-2xl text-purple-400" />
            <span className="text-sm font-bold text-white">
              All NFTs minted on Solana blockchain
            </span>
          </div>
        </motion.div>

        {!connected ? (
          <LoginPrompt
            title="Connect Wallet to Purchase Horses"
            message="Open mystery boxes and discover unique NFT horses on the Solana blockchain"
            buttonText="Connect Wallet to Start"
            icon={<MdCardGiftcard className="text-8xl text-neon-purple mx-auto mb-4 animate-float" />}
            className="max-w-2xl mx-auto"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-6">
            {[1, 2, 3].map((level, index) => (
              <motion.div
                key={level}
                initial={{ opacity: 0, y: 40, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{
                  delay: 0.2 + index * 0.15,
                  duration: 0.6,
                }}
              >
                <MysteryBox
                  level={level}
                  price={HORSE_PRICES[level]}
                  onBuy={handleBuyBox}
                  disabled={txLoading}
                />
              </motion.div>
            ))}
            <LockedTier4Card />
          </div>
        )}

      </div>
    </div>
  );
}
