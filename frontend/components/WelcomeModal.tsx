'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { GiHorseHead, GiTrophy } from 'react-icons/gi';
import { MdCardGiftcard, MdClose } from 'react-icons/md';
import { FaWallet } from 'react-icons/fa';
import { IoSparkles } from 'react-icons/io5';
import Link from 'next/link';

interface WelcomeModalProps {
  forceShow?: boolean;
  onClose?: () => void;
}

export default function WelcomeModal({ forceShow = false, onClose }: WelcomeModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleClose = () => {
    onClose?.();
  };

  return null;

  if (!mounted) return null;

  const modalContent = (
    <AnimatePresence>
      {forceShow && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={handleClose}
          />

          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', duration: 0.5 }}
            className="relative w-full max-w-2xl glass rounded-3xl border-2 border-purple-500/30 overflow-hidden shadow-2xl"
            style={{ maxHeight: '90vh' }}
          >
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 z-10 p-2 rounded-full glass hover:bg-white/20 transition-all duration-300 hover:scale-110"
              aria-label="Close modal"
            >
              <MdClose className="text-2xl text-gray-300 hover:text-white" />
            </button>

            <div className="relative overflow-y-auto" style={{ maxHeight: '90vh' }}>
              <div className="bg-gradient-to-br from-purple-600/20 via-pink-600/20 to-blue-600/20 p-8 text-center">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  className="inline-block mb-4"
                >
                  <GiHorseHead className="text-8xl text-neon-purple" />
                </motion.div>

                <h1 className="text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-neon-blue via-neon-purple to-neon-pink bg-clip-text text-transparent">
                  Welcome to Pixel Race
                </h1>

                <p className="text-xl text-gray-300 mb-2">
                  A Web3 Horse Racing Game on Solana
                </p>

                <div className="flex items-center justify-center gap-2 text-neon-yellow">
                  <IoSparkles className="text-2xl" />
                  <span className="text-sm font-medium">Real NFT Horses • Real SOL Rewards</span>
                  <IoSparkles className="text-2xl" />
                </div>
              </div>

              <div className="p-8 space-y-6">
                <div className="space-y-4">
                  <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="flex items-start gap-4 p-4 rounded-2xl glass border border-blue-500/30"
                  >
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                      <span className="text-2xl font-bold text-neon-blue">1</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <FaWallet className="text-xl text-neon-blue" />
                        <h3 className="text-lg font-bold text-white">Connect Your Wallet</h3>
                      </div>
                      <p className="text-sm text-gray-400">
                        Link your Solana wallet (Phantom or Solflare) to get started
                      </p>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="flex items-start gap-4 p-4 rounded-2xl glass border border-purple-500/30"
                  >
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                      <span className="text-2xl font-bold text-neon-purple">2</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <MdCardGiftcard className="text-xl text-neon-purple" />
                        <h3 className="text-lg font-bold text-white">Buy Your First Horse</h3>
                      </div>
                      <p className="text-sm text-gray-400">
                        Open a mystery box to receive your NFT horse with unique stats
                      </p>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="flex items-start gap-4 p-4 rounded-2xl glass border border-green-500/30"
                  >
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                      <span className="text-2xl font-bold text-neon-green">3</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <GiHorseHead className="text-xl text-neon-green" />
                        <h3 className="text-lg font-bold text-white">Join Races</h3>
                      </div>
                      <p className="text-sm text-gray-400">
                        Enter your horses in races and compete against other players
                      </p>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="flex items-start gap-4 p-4 rounded-2xl glass border border-yellow-500/30"
                  >
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center">
                      <span className="text-2xl font-bold text-neon-yellow">4</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <GiTrophy className="text-xl text-neon-yellow" />
                        <h3 className="text-lg font-bold text-white">Win SOL Rewards</h3>
                      </div>
                      <p className="text-sm text-gray-400">
                        Place in the top 3 to earn real SOL from the prize pool
                      </p>
                    </div>
                  </motion.div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <Link href="/mystery-box" className="flex-1" onClick={handleClose}>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full px-6 py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-3"
                      style={{
                        background: 'linear-gradient(135deg, #a855f7, #ec4899, #f59e0b)',
                        boxShadow: '0 0 30px rgba(168, 85, 247, 0.5)',
                      }}
                    >
                      <MdCardGiftcard className="text-2xl" />
                      <span>Get Your First Horse</span>
                      <IoSparkles className="text-2xl" />
                    </motion.button>
                  </Link>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleClose}
                    className="px-6 py-4 rounded-2xl font-bold text-lg border-2 border-gray-600 glass hover:bg-white/10 transition-all duration-300"
                  >
                    Explore First
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return null;
  return createPortal(modalContent, document.body);
}
