'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Confetti from 'react-confetti';
import { Horse } from '@/types';
import { useRouter } from 'next/navigation';
import { SiSolana } from 'react-icons/si';
import { FaWeightHanging, FaBrain, FaBatteryFull, FaAppleAlt, FaStar, FaFlagCheckered, FaHeart } from 'react-icons/fa';
import { GiTrophy, GiBrain } from 'react-icons/gi';

interface HorseRevealModalProps {
  isOpen: boolean;
  horse: Horse | null;
  onComplete: () => void;
}

type AnimationPhase = 'boxOpening' | 'exploding' | 'cardFlying' | 'revealed';

const LEVEL_THEMES = {
  1: {
    color: '#10b981',
    glowColor: 'rgba(16, 185, 129, 0.6)',
    gradientFrom: '#10b981',
    gradientTo: '#059669',
  },
  2: {
    color: '#3b82f6',
    glowColor: 'rgba(59, 130, 246, 0.6)',
    gradientFrom: '#3b82f6',
    gradientTo: '#2563eb',
  },
  3: {
    color: '#eab308',
    glowColor: 'rgba(234, 179, 8, 0.7)',
    gradientFrom: '#eab308',
    gradientTo: '#ca8a04',
  },
};

function HorseGallopAnimation({ color }: { color: string }) {
  return (
    <div className="relative">
      <motion.div
        className="text-[120px] leading-none horse-animated-slow flex items-center justify-center"
        style={{
          color: color,
          filter: `drop-shadow(0 0 30px ${color}80)`,
        }}
        animate={{
          scale: [1, 1.08, 1],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        🐎
      </motion.div>
      <motion.div
        className="absolute inset-0 -z-10 blur-3xl"
        style={{
          background: `radial-gradient(circle, ${color}80, transparent)`,
        }}
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.5, 0.8, 0.5],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      <motion.div
        className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-32 h-8 rounded-full blur-xl"
        style={{
          background: `radial-gradient(circle, ${color}60, transparent)`,
        }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </div>
  );
}

export default function HorseRevealModal({ isOpen, horse, onComplete }: HorseRevealModalProps) {
  const router = useRouter();
  const [phase, setPhase] = useState<AnimationPhase>('boxOpening');
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    }
  }, []);

  useEffect(() => {
    if (!isOpen || !horse) return;

    document.body.style.overflow = 'hidden';

    const sequence = async () => {
      setPhase('boxOpening');
      await new Promise(resolve => setTimeout(resolve, 800));

      setPhase('exploding');
      await new Promise(resolve => setTimeout(resolve, 400));

      setPhase('cardFlying');
      await new Promise(resolve => setTimeout(resolve, 1200));

      setPhase('revealed');
      await new Promise(resolve => setTimeout(resolve, 5000));

      document.body.style.overflow = 'unset';
      onComplete();
      router.push('/stable');
    };

    sequence();

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, horse, onComplete, router]);

  if (!isOpen || !horse) return null;

  const level = horse.stats?.level ?? 1;
  const theme = LEVEL_THEMES[level as keyof typeof LEVEL_THEMES] || LEVEL_THEMES[1];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm overflow-hidden"
      >
        {(phase === 'exploding' || phase === 'cardFlying' || phase === 'revealed') && (
          <Confetti
            width={windowSize.width}
            height={windowSize.height}
            recycle={phase !== 'revealed'}
            numberOfPieces={phase === 'exploding' ? 500 : 200}
            gravity={0.3}
          />
        )}

        {phase === 'boxOpening' && (
          <motion.div
            className="absolute top-1/2 left-1/2"
            initial={{ scale: 1, x: '-50%', y: '-50%' }}
            animate={{
              scale: 1.2,
              y: '-60%',
            }}
            transition={{ duration: 0.8 }}
          >
            <svg width="256" height="256" viewBox="0 0 256 256">
              <defs>
                <radialGradient id="lightRays">
                  <stop offset="0%" stopColor={theme.color} stopOpacity="0.8" />
                  <stop offset="100%" stopColor={theme.color} stopOpacity="0" />
                </radialGradient>
              </defs>

              {[...Array(8)].map((_, i) => {
                const angle = (i / 8) * Math.PI * 2;
                const x2 = 128 + Math.cos(angle) * 100;
                const y2 = 100 + Math.sin(angle) * 100;
                return (
                  <motion.line
                    key={i}
                    x1="128"
                    y1="100"
                    x2={x2}
                    y2={y2}
                    stroke={theme.color}
                    strokeWidth="3"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 1, 0] }}
                    transition={{ duration: 0.8, delay: i * 0.05 }}
                  />
                );
              })}
            </svg>
          </motion.div>
        )}

        {(phase === 'exploding' || phase === 'cardFlying' || phase === 'revealed') && (
          <motion.div
            className="absolute top-1/2 left-1/2 w-full max-w-md px-4"
            initial={{
              scale: 0.3,
              x: '-50%',
              y: '100%',
              rotateY: 180,
              opacity: 0,
            }}
            animate={{
              scale: phase === 'revealed' ? 0.95 : 0.7,
              y: phase === 'revealed' ? '-50%' : '-40%',
              x: '-50%',
              rotateY: 0,
              opacity: 1,
            }}
            transition={{
              duration: phase === 'cardFlying' ? 1.2 : 0.4,
              ease: [0.34, 1.56, 0.64, 1],
            }}
            style={{ transformStyle: 'preserve-3d' }}
          >
            <div
              className="relative rounded-3xl overflow-hidden border-4"
              style={{
                background: 'linear-gradient(135deg, rgba(15, 15, 25, 0.98), rgba(25, 25, 40, 0.98))',
                borderColor: horse.color,
                boxShadow: `0 0 60px ${horse.color}60, inset 0 0 40px rgba(0, 0, 0, 0.8)`,
              }}
            >
              <motion.div
                className="absolute inset-0 opacity-10"
                style={{
                  background: `linear-gradient(135deg, ${horse.color}, transparent)`,
                }}
                animate={{
                  opacity: [0.05, 0.15, 0.05],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />

              <div className="relative z-10 p-4">
                <motion.div
                  initial={{ y: -30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-center mb-3"
                >
                  <motion.div
                    className="inline-block px-2 py-1 rounded-full border-2"
                    style={{
                      borderColor: horse.color,
                      background: `${horse.color}20`,
                      boxShadow: `0 0 30px ${horse.color}80`,
                    }}
                    animate={{
                      boxShadow: [
                        `0 0 30px ${horse.color}80`,
                        `0 0 50px ${horse.color}80`,
                        `0 0 30px ${horse.color}80`,
                      ],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                    }}
                  >
                    <span
                      className="text-xs font-black tracking-[0.4em]"
                      style={{ color: horse.color }}
                    >
                      LEVEL {level}
                    </span>
                  </motion.div>
                </motion.div>

                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{
                    type: 'spring',
                    stiffness: 200,
                    damping: 15,
                    delay: 0.3,
                  }}
                  className="mb-3 flex justify-center"
                >
                  <HorseGallopAnimation color={horse.color} />
                </motion.div>

                <motion.h3
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="text-xl font-black text-center mb-2 tracking-wide"
                  style={{
                    fontFamily: 'Muybridge, Orbitron, sans-serif',
                    color: horse.color,
                    textShadow: `0 0 40px ${horse.color}80, 0 0 80px ${horse.color}60, 0 4px 20px rgba(0, 0, 0, 0.8)`,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                  }}
                >
                  {horse.name}
                </motion.h3>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="text-sm text-gray-400 text-center mb-4 font-medium"
                >
                  Speed Score: {horse.stats?.speed_score.toFixed(0)}/100
                </motion.p>

                <div className="grid grid-cols-2 gap-2.5 mb-4">
                  {[
                    {
                      label: 'AGE',
                      value: horse.age.toString(),
                      unit: 'years',
                      icon: FaStar,
                      percentage: (horse.age / 10) * 100,
                    },
                    {
                      label: 'WEIGHT',
                      value: horse.stats?.weight?.toFixed(0) || '500',
                      unit: 'kg',
                      icon: FaWeightHanging,
                      percentage: ((Number(horse.stats?.weight || 500) / 1000) * 100),
                    },
                    {
                      label: 'DETERMINATION',
                      value: horse.stats?.determination || '50',
                      unit: '%',
                      icon: FaBrain,
                      percentage: Number(horse.stats?.determination || 50),
                    },
                    {
                      label: 'INSTINCT',
                      value: horse.stats?.instinct?.toString() || '0',
                      unit: '%',
                      icon: GiBrain,
                      percentage: Number(horse.stats?.instinct || 0),
                    },
                    {
                      label: 'SATIETY',
                      value: horse.stats?.satiety || '100',
                      unit: '%',
                      icon: FaAppleAlt,
                      percentage: Number(horse.stats?.satiety || 100),
                    },
                    {
                      label: 'ENERGY',
                      value: horse.stats?.energy || '100',
                      unit: '%',
                      icon: FaBatteryFull,
                      percentage: Number(horse.stats?.energy || 100),
                    },

                    {
                      label: 'BOND',
                      value: horse.stats?.bond?.toString() || '0',
                      unit: '%',
                      icon: FaHeart,
                      percentage: Number(horse.stats?.bond || 0),
                    },
                    {
                      label: 'FAME',
                      value: horse.stats?.fame?.toString() || '0',
                      unit: '%',
                      icon: GiTrophy,
                      percentage: Number(horse.stats?.fame || 0),
                    },
                  ].map((stat, idx) => {
                    const IconComponent = stat.icon;
                    return (
                      <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{
                          delay: 0.7 + idx * 0.05,
                          type: 'spring',
                          stiffness: 200,
                          damping: 20,
                        }}
                        className="rounded-lg p-2 border relative overflow-hidden group "
                        style={{
                          borderColor: `${horse.color}40`,
                          background: 'rgba(0, 0, 0, 0.6)',
                        }}
                      >
                        <motion.div
                          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          style={{
                            background: `linear-gradient(135deg, ${horse.color}15, transparent)`,
                          }}
                        />

                        <div className="flex items-center gap-2 mb-1.5 relative z-10">
                          <motion.div
                            animate={{
                              scale: [1, 1.1, 1],
                            }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              delay: idx * 0.2,
                            }}
                          >
                            <IconComponent
                              className="text-sm"
                              style={{ color: horse.color }}
                            />
                          </motion.div>
                          <div className="flex-1">
                            <p className="text-[10px] text-gray-500 font-bold tracking-wider">
                              {stat.label}
                            </p>
                            <p className="text-sm font-black" style={{ color: horse.color }}>
                              {stat.value}
                              {stat.unit && <span className="text-[10px] text-gray-500 ml-1 font-normal">{stat.unit}</span>}
                            </p>
                          </div>
                        </div>

                        <div className="relative h-1.5 rounded-full overflow-hidden bg-black/60 z-10">
                          <motion.div
                            className="absolute inset-y-0 left-0 rounded-full"
                            style={{
                              background: `linear-gradient(90deg, ${horse.color}, ${horse.color}cc)`,
                              boxShadow: `0 0 10px ${horse.color}80`,
                            }}
                            initial={{ width: 0 }}
                            animate={{ width: `${stat.percentage}%` }}
                            transition={{
                              delay: 0.8 + idx * 0.1,
                              duration: 1,
                              ease: [0.34, 1.56, 0.64, 1],
                            }}
                          />
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.1 }}
                  className="rounded-xl p-3 border-2 flex items-center gap-3 relative overflow-hidden"
                  style={{
                    borderColor: `${horse.color}80`,
                    background: 'rgba(0, 0, 0, 0.7)',
                    boxShadow: `0 0 40px ${horse.color}60`,
                  }}
                >
                  <motion.div
                    className="absolute inset-0 opacity-20"
                    style={{
                      background: `linear-gradient(90deg, transparent, ${horse.color}, transparent)`,
                    }}
                    animate={{
                      x: ['-100%', '200%'],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: 'linear',
                    }}
                  />

                  <SiSolana className="text-2xl flex-shrink-0 relative z-10" style={{ color: horse.color }} />

                  <div className="flex-1 min-w-0 relative z-10">
                    <p className="text-[10px] text-gray-400 font-bold mb-0.5 tracking-wider">NFT SUCCESSFULLY MINTED</p>
                    <p className="text-sm font-bold text-white">Solana Blockchain</p>
                  </div>

                  <motion.div
                    className="text-2xl"
                    animate={{
                      scale: [1, 1.3, 1],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                    }}
                  >
                    ✨
                  </motion.div>
                </motion.div>
              </div>
            </div>

            {phase === 'revealed' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-6 text-center"
              >
                <h2 className="text-2xl font-bold text-white mb-2">
                  Welcome {horse.name}!
                </h2>
                <p className="text-sm text-gray-300">
                  Your new Level {level} champion is ready to race!
                </p>
              </motion.div>
            )}
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
