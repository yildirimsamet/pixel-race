'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import { Horse, HorseBuyResponse } from '@/types';
import { SiSolana } from 'react-icons/si';
import { FaWeightHanging, FaBrain, FaBatteryFull, FaAppleAlt, FaStar, FaFlagCheckered, FaBirthdayCake, FaHeart, FaTrophy, FaBolt, FaWeight } from 'react-icons/fa';
import { GiMuscleUp } from 'react-icons/gi';
import { MdFastfood, MdStars } from 'react-icons/md';
import confettiData from '@/public/assets/animations/confetti.js';

const Lottie = dynamic(() => import('lottie-react').then(mod => mod.default || mod), {
  ssr: false,
  loading: () => null
});

interface MysteryBoxProps {
  level: number;
  price: number;
  onBuy: (level: number) => Promise<HorseBuyResponse>;
  disabled?: boolean;
}

const LEVEL_THEMES = {
  1: {
    color: '#10b981',
    glowColor: 'rgba(16, 185, 129, 0.6)',
    name: 'LEVEL 1',
    tier: 'LEVEL 1',
    gradientFrom: '#10b981',
    gradientTo: '#059669',
    cardGradient: 'linear-gradient(135deg, #10b981, #059669)',
  },
  2: {
    color: '#3b82f6',
    glowColor: 'rgba(59, 130, 246, 0.6)',
    name: 'LEVEL 2',
    tier: 'LEVEL 2',
    gradientFrom: '#3b82f6',
    gradientTo: '#2563eb',
    cardGradient: 'linear-gradient(135deg, #3b82f6, #2563eb)',
  },
  3: {
    color: '#eab308',
    glowColor: 'rgba(234, 179, 8, 0.7)',
    name: 'LEVEL 3',
    tier: 'LEVEL 3',
    gradientFrom: '#eab308',
    gradientTo: '#ca8a04',
    cardGradient: 'linear-gradient(135deg, #eab308, #ca8a04)',
  },
};

function GiftBox3D({ level, color, isMinting, isOpening }: { level: number; color: string; isMinting?: boolean; isOpening?: boolean }) {
  const theme = LEVEL_THEMES[level as keyof typeof LEVEL_THEMES];

  return (
    <div className="relative w-64 h-64">
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        animate={isMinting ? {
          x: [-3, 3, -3, 3, -3, 3, 0],
          y: [-2, 2, -2, 2, 0],
          rotate: [-1, 1, -1, 1, -1, 1, 0],
          scale: [1, 1.03, 1, 1.03, 1],
        } : {
          rotateY: [0, 10, -10, 0],
        }}
        transition={isMinting ? {
          duration: 0.6,
          repeat: Infinity,
          ease: "easeInOut",
        } : {
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        style={{ transformStyle: "preserve-3d" }}
      >
        <svg width="256" height="256" viewBox="0 0 256 256" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id={`boxGrad-${level}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={theme.gradientFrom} />
              <stop offset="100%" stopColor={theme.gradientTo} />
            </linearGradient>
            <linearGradient id={`boxDark-${level}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={theme.gradientTo} />
              <stop offset="100%" stopColor={theme.gradientFrom} stopOpacity="0.6" />
            </linearGradient>
            <linearGradient id={`ribbonGrad-${level}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
              <stop offset="50%" stopColor={color} stopOpacity="0.8" />
              <stop offset="100%" stopColor={theme.gradientTo} stopOpacity="0.7" />
            </linearGradient>
            <filter id={`glow-${level}`}>
              <feGaussianBlur stdDeviation="8" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
            <filter id={`shine-${level}`}>
              <feGaussianBlur in="SourceAlpha" stdDeviation="4"/>
              <feOffset dx="2" dy="2" result="offsetblur"/>
              <feComponentTransfer>
                <feFuncA type="linear" slope="0.5"/>
              </feComponentTransfer>
              <feMerge>
                <feMergeNode/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
            <radialGradient id={`lightRays-${level}`}>
              <stop offset="0%" stopColor={theme.color} stopOpacity="0.8" />
              <stop offset="100%" stopColor={theme.color} stopOpacity="0" />
            </radialGradient>
          </defs>

          <g>
            <rect
              x="64"
              y="100"
              width="128"
              height="96"
              fill={`url(#boxGrad-${level})`}
              stroke={color}
              strokeWidth="2"
              rx="4"
              filter={`url(#glow-${level})`}
            />

            <path
              d="M64 100 L128 80 L192 100"
              fill={`url(#boxDark-${level})`}
              stroke={color}
              strokeWidth="2"
              opacity="0.8"
            />

            <rect
              x="70"
              y="106"
              width="116"
              height="84"
              fill="none"
              stroke={color}
              strokeWidth="1"
              strokeDasharray="4 4"
              opacity="0.3"
              rx="2"
            />
          </g>

          <motion.g
            animate={isOpening ? {
              y: [-40, -120],
              rotateX: [0, -25],
              opacity: [1, 0],
            } : {}}
            transition={{
              duration: 0.8,
              ease: [0.34, 1.56, 0.64, 1],
            }}
            style={{ transformOrigin: '128px 60px' }}
          >
            <rect
              x="64"
              y="60"
              width="128"
              height="40"
              fill={`url(#boxDark-${level})`}
              stroke={color}
              strokeWidth="2"
              rx="4"
              filter={`url(#shine-${level})`}
            />

            <path
              d="M64 60 L128 40 L192 60"
              fill={theme.gradientFrom}
              stroke={color}
              strokeWidth="2"
              opacity="0.9"
            />

            <ellipse
              cx="128"
              cy="60"
              rx="64"
              ry="8"
              fill={color}
              opacity="0.2"
            />

            <rect
              x="122"
              y="40"
              width="12"
              height="60"
              fill={`url(#ribbonGrad-${level})`}
              stroke={color}
              strokeWidth="1.5"
              rx="2"
              filter={`url(#glow-${level})`}
            />

            <path
              d="M128 40 Q138 30 148 35 Q143 45 128 50 Q113 45 108 35 Q118 30 128 40 Z"
              fill={`url(#ribbonGrad-${level})`}
              stroke={color}
              strokeWidth="1.5"
              filter={`url(#glow-${level})`}
            />

            <circle
              cx="128"
              cy="40"
              r="6"
              fill="#ffffff"
              opacity="0.6"
              filter={`url(#glow-${level})`}
            />
          </motion.g>

          {isOpening && (
            <>
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
                    stroke={`url(#lightRays-${level})`}
                    strokeWidth="3"
                    initial={{ opacity: 0, strokeWidth: 0 }}
                    animate={{ opacity: [0, 1, 0], strokeWidth: [0, 4, 0] }}
                    transition={{
                      duration: 0.8,
                      delay: i * 0.05,
                      ease: 'easeOut',
                    }}
                  />
                );
              })}
            </>
          )}

          <rect
            x="122"
            y="100"
            width="12"
            height="96"
            fill={`url(#ribbonGrad-${level})`}
            stroke={color}
            strokeWidth="1.5"
            rx="2"
            filter={`url(#glow-${level})`}
          />

          <rect
            x="64"
            y="124"
            width="128"
            height="12"
            fill={`url(#ribbonGrad-${level})`}
            stroke={color}
            strokeWidth="1.5"
            rx="2"
            filter={`url(#glow-${level})`}
          />

          <rect
            x="75"
            y="115"
            width="20"
            height="20"
            fill="#ffffff"
            opacity="0.1"
            rx="2"
          />
          <rect
            x="161"
            y="170"
            width="15"
            height="15"
            fill="#ffffff"
            opacity="0.15"
            rx="2"
          />
        </svg>
      </motion.div>

      <motion.div
        className="absolute inset-0 rounded-full blur-3xl opacity-40 -z-10"
        style={{
          background: `radial-gradient(circle, ${color}, transparent)`,
        }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </div>
  );
}

function ParticleExplosion({ theme }: { theme: typeof LEVEL_THEMES[1] }) {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {[...Array(50)].map((_, i) => {
        const angle = (i / 50) * Math.PI * 2;
        const distance = 100 + Math.random() * 200;
        const x = Math.cos(angle) * distance;
        const y = Math.sin(angle) * distance;

        return (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full"
            style={{
              background: theme.color,
              left: '50%',
              top: '50%',
              boxShadow: `0 0 10px ${theme.glowColor}`,
            }}
            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
            animate={{
              x,
              y,
              opacity: 0,
              scale: [1, 1.5, 0],
            }}
            transition={{
              duration: 1.2,
              ease: 'easeOut',
            }}
          />
        );
      })}
    </div>
  );
}

function ConfettiExplosion({ theme }: { theme: typeof LEVEL_THEMES[1] }) {

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 9999 }}>
      <Lottie
        animationData={confettiData}
        loop={false}
        style={{
          width: '100%',
          height: '100%',
          position: 'absolute',
          top: 0,
          left: 0,
        }}
      />
    </div>
  );
}

function ShockwaveRing({ theme }: { theme: typeof LEVEL_THEMES[1] }) {
  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute rounded-full border-4"
          style={{
            borderColor: theme.color,
            width: 0,
            height: 0,
          }}
          initial={{ width: 0, height: 0, opacity: 0.8 }}
          animate={{
            width: 800,
            height: 800,
            opacity: 0,
          }}
          transition={{
            duration: 1.2,
            delay: i * 0.15,
            ease: 'easeOut',
          }}
        />
      ))}
    </div>
  );
}

function HorseGallopAnimation({ color }: { color: string }) {
  return (
    <div className="relative">
      <motion.div
        className="text-[220px] leading-none horse-animated-slow flex items-center justify-center"
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

export default function MysteryBox({ level, price, onBuy, disabled }: MysteryBoxProps) {
  const [animationPhase, setAnimationPhase] = useState<'idle' | 'minting' | 'boxOpening' | 'exploding' | 'cardFlying' | 'revealed'>('idle');
  const [revealedHorse, setRevealedHorse] = useState<Horse | null>(null);
  const autoCloseTimerRef = useRef<NodeJS.Timeout>();

  const theme = LEVEL_THEMES[level as keyof typeof LEVEL_THEMES];

  useEffect(() => {
    return () => {
      if (autoCloseTimerRef.current) {
        clearTimeout(autoCloseTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (animationPhase !== 'idle') {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [animationPhase]);

  const handleOpen = async () => {
    setAnimationPhase('minting');

    try {
      const response = await onBuy(level);
      setRevealedHorse(response.horse);

      setAnimationPhase('boxOpening');
      await new Promise(resolve => setTimeout(resolve, 800));

      setAnimationPhase('exploding');
      await new Promise(resolve => setTimeout(resolve, 400));

      setAnimationPhase('cardFlying');
      await new Promise(resolve => setTimeout(resolve, 1200));

      setAnimationPhase('revealed');

      autoCloseTimerRef.current = setTimeout(() => {
        setAnimationPhase('idle');
        setRevealedHorse(null);
      }, 8000);
    } catch (error) {
      console.error('Mystery box error:', error);
      setAnimationPhase('idle');
    }
  };

  return (
    <>
      <motion.button
        onClick={handleOpen}
        disabled={disabled}
        whileHover={disabled ? {} : {
          scale: 1.05,
          y: -12,
        }}
        whileTap={disabled ? {} : { scale: 0.95 }}
        className="relative w-full rounded-3xl overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed group"
        style={{
          height: '660px',
          background: 'linear-gradient(135deg, rgba(10, 10, 20, 0.95), rgba(20, 20, 35, 0.95))',
          border: `3px solid ${theme.color}`,
          boxShadow: `0 10px 15px ${theme.glowColor}`,
        }}
      >
        <motion.div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{
            background: `linear-gradient(135deg, ${theme.color}30, transparent)`,
          }}
        />

        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full blur-3xl opacity-40"
          style={{
            background: `radial-gradient(circle, ${theme.color}, transparent)`,
          }}
        />

        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
        />

        <div className="relative z-10 flex flex-col items-center justify-center h-full p-6">
          <motion.div
            className="px-8 py-3 rounded-full border-2 mb-6"
            style={{
              borderColor: theme.color,
              background: `${theme.color}25`,
              boxShadow: `0 0 25px ${theme.glowColor}`,
            }}
            animate={{
              boxShadow: [
                `0 0 25px ${theme.glowColor}`,
                `0 0 40px ${theme.glowColor}`,
                `0 0 25px ${theme.glowColor}`,
              ],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
            }}
          >
            <span
              className="text-sm font-black tracking-[0.4em]"
              style={{ color: theme.color }}
            >
              {theme.tier}
            </span>
          </motion.div>

          <motion.div
            className="mb-4"
            animate={{
              y: [0, -20, 0],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            <GiftBox3D level={level} color={theme.color} isMinting={false} />
          </motion.div>

          <h3
            className="text-3xl font-black mb-3 tracking-tight"
            style={{
              color: theme.color,
              textShadow: `0 0 30px ${theme.glowColor}`,
            }}
          >
            {theme.name} BOX
          </h3>

          <p className="text-sm text-gray-400 mb-6 text-center font-medium tracking-wide">
            Random NFT Horse
          </p>

          <motion.div
            className="rounded-full px-10 py-4 mb-6 flex items-center gap-3 border-2"
            style={{
              background: `${theme.color}20`,
              borderColor: theme.color,
              boxShadow: `0 0 25px ${theme.glowColor}`,
            }}
            whileHover={{
              boxShadow: `0 0 50px ${theme.glowColor}`,
              scale: 1.05,
            }}
          >
            <SiSolana className="text-3xl" style={{ color: theme.color }} />
            <span className="text-3xl font-black text-white">
              {price} SOL
            </span>
          </motion.div>

          <motion.div
            className="rounded-full px-14 py-5 font-black text-lg tracking-wider relative overflow-hidden"
            style={{
              background: theme.cardGradient,
              boxShadow: `0 10px 40px ${theme.glowColor}`,
            }}
            whileHover={{
              boxShadow: `0 15px 60px ${theme.glowColor}`,
              scale: 1.05,
            }}
          >
            <motion.div
              className="absolute inset-0 opacity-40"
              style={{
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
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
            <span className="relative z-10 text-white">OPEN BOX</span>
          </motion.div>
        </div>

        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full"
            style={{
              background: theme.color,
              left: `${15 + (i * 7)}%`,
              top: `${15 + (i % 4) * 20}%`,
              boxShadow: `0 0 8px ${theme.glowColor}`,
            }}
            animate={{
              y: [0, -40, 0],
              opacity: [0, 1, 0],
              scale: [0, 1.5, 0],
            }}
            transition={{
              duration: 3 + (i % 3),
              repeat: Infinity,
              delay: i * 0.3,
            }}
          />
        ))}
      </motion.button>

      {animationPhase !== 'idle' && (
        <AnimatePresence mode="wait">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed glass inset-0 z-50 flex items-center justify-center"
            style={{
              background: 'radial-gradient(circle at center, rgba(0, 0, 0, 0.15), rgba(0, 0, 0, 0.15))',
              backdropFilter: 'blur(10px)',
            }}
            onClick={() => {
              if (animationPhase === 'revealed') {
                setAnimationPhase('idle');
                setRevealedHorse(null);
                if (autoCloseTimerRef.current) {
                  clearTimeout(autoCloseTimerRef.current);
                }
              }
            }}
          >
          {animationPhase === 'minting' && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="relative flex flex-col items-center"
            >
              <GiftBox3D level={level} color={theme.color} isMinting={true} />

              {[0, 1, 2, 3, 4, 5, 6 ,7, 8, 9].map((i) => (
                <motion.div
                  key={i}
                  className="absolute inset-0 rounded-full border-4"
                  style={{ borderColor: theme.color }}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{
                    scale: [0, 7],
                    opacity: [0.1, 0.03, 0],
                  }}
                  transition={{
                    duration: 5,
                    repeat: Infinity,
                    delay: i * 0.5,
                  }}
                />
              ))}

              <motion.div
                className="mt-8 flex flex-col items-center gap-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <motion.p
                  className="text-4xl font-black text-center tracking-[0.3em]"
                  style={{
                    fontFamily: 'Orbitron, sans-serif',
                    color: theme.color,
                    textShadow: `0 0 30px ${theme.glowColor}, 0 0 60px ${theme.glowColor}`,
                  }}
                  animate={{
                    opacity: [0.7, 1, 0.7],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                  }}
                >
                  MINTING...
                </motion.p>

                <motion.div className="flex items-center gap-3">
                  <motion.div
                  >
                    <SiSolana className="text-3xl" style={{ color: theme.color }} />
                  </motion.div>
                  <p className="text-lg text-gray-400 font-medium">Generating Your Horse...</p>
                </motion.div>

                <div className="flex gap-2 mt-2">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: theme.color }}
                      animate={{
                        scale: [1, 1.5, 1],
                        opacity: [0.3, 1, 0.3],
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        delay: i * 0.2,
                      }}
                    />
                  ))}
                </div>
              </motion.div>
            </motion.div>
          )}

          {animationPhase === 'boxOpening' && (
            <motion.div
              initial={{ scale: 1 }}
              className="relative flex items-center justify-center"
            >
              <GiftBox3D level={level} color={theme.color} isMinting={false} isOpening={true} />
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: [0, 1, 0], scale: [0, 2, 3] }}
                transition={{ duration: 0.8 }}
                className="absolute inset-0 rounded-full"
                style={{
                  background: `radial-gradient(circle, ${theme.color}, transparent)`,
                  filter: 'blur(50px)',
                }}
              />
            </motion.div>
          )}

          {animationPhase === 'exploding' && (
            <motion.div className="relative">
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: [0, 1, 0.5, 0], scale: [0, 1.5, 2, 2.5] }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="absolute inset-0 rounded-full"
                style={{
                  background: `radial-gradient(circle, ${theme.color}, transparent)`,
                  filter: 'blur(60px)',
                  width: '600px',
                  height: '600px',
                  left: '50%',
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                }}
              />
              <ParticleExplosion theme={theme} />
              <ShockwaveRing theme={theme} />
              <ConfettiExplosion theme={theme} />
            </motion.div>
          )}

          {(animationPhase === 'cardFlying' || animationPhase === 'revealed') && revealedHorse && (
            <>
              {animationPhase === 'cardFlying' && <ConfettiExplosion theme={theme} />}
              <div className="w-full px-8 mt-20" onClick={(e) => e.stopPropagation()}>
                <motion.div
                  initial={{ y: 0, opacity: 0, scale: 0.3, rotateY: -180, rotateX: 45 }}
                  animate={animationPhase === 'cardFlying' ? {
                    y: [0, -100, -50, 0],
                    opacity: [0, 1, 1, 1],
                    scale: [0.3, 0.5, 0.7],
                    rotateY: [-180, -90, -45, 0],
                    rotateX: [45, 15, 5, 0],
                  } : {
                    y: 0,
                    opacity: 1,
                    scale: 0.7,
                    rotateY: 0,
                    rotateX: 0,
                  }}
                  transition={animationPhase === 'cardFlying' ? {
                    duration: 1.2,
                    ease: [0.34, 1.56, 0.64, 1],
                    times: [0, 0.4, 0.7, 1],
                  } : {
                    duration: 0.5,
                    ease: "easeOut",
                  }}
                  className="relative w-full max-w-2xl mx-auto"
                >
                <motion.div
                  className="absolute -inset-4 blur-3xl"
                  style={{
                    background: `radial-gradient(circle, ${revealedHorse.color}80, transparent)`,
                  }}
                  animate={{
                    scale: [1, 1.15, 1],
                  }}
                  transition={{
                    duration: 2.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />

                <div
                  className="relative rounded-3xl overflow-hidden border-4"
                  style={{
                    background: 'linear-gradient(135deg, rgba(15, 15, 25, 0.98), rgba(25, 25, 40, 0.98))',
                    borderColor: `${revealedHorse.color}`,
                    boxShadow: `0 0 60px ${revealedHorse.color}60, inset 0 0 40px rgba(0, 0, 0, 0.8)`,
                  }}
                >
                <motion.div
                  className="absolute inset-0 opacity-10"
                  style={{
                    background: `linear-gradient(135deg, ${revealedHorse.color}, transparent)`,
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

                <div className="relative z-10 p-10">
                  <motion.div
                    initial={{ y: -30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-center mb-6"
                  >
                    <motion.div
                      className="inline-block px-4 py-2 rounded-full border-2"
                      style={{
                        borderColor: `${revealedHorse.color}`,
                        background: `${revealedHorse.color}20`,
                        boxShadow: `0 0 30px ${revealedHorse.color}80`,
                      }}
                      animate={{
                        boxShadow: [
                          `0 0 30px ${revealedHorse.color}80`,
                          `0 0 50px ${revealedHorse.color}80`,
                          `0 0 30px ${revealedHorse.color}80`,
                        ],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                      }}
                    >
                      <span
                        className="text-base font-black tracking-[0.4em]"
                        style={{ color: revealedHorse.color }}
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
                    className="mb-4 flex justify-center"
                  >
                    <HorseGallopAnimation color={revealedHorse.color} />
                  </motion.div>

                  <motion.h3
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="text-4xl font-black text-center mb-3 tracking-wide"
                    style={{
                      fontFamily: 'Muybridge, Orbitron, sans-serif',
                      color: revealedHorse.color,
                      textShadow: `0 0 40px ${revealedHorse.color}80, 0 0 80px ${revealedHorse.color}60, 0 4px 20px rgba(0, 0, 0, 0.8)`,
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                    }}
                  >
                    {revealedHorse.name}
                  </motion.h3>

                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="text-sm text-gray-400 text-center mb-8 font-medium"
                  >
                    Born {new Date(revealedHorse.birthdate).toLocaleDateString()} • {revealedHorse.age} years old
                  </motion.p>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    {[
                      {
                        label: 'AGE',
                        value: revealedHorse.age?.toString() || '1',
                        unit: 'yr',
                        icon: FaBirthdayCake,
                        percentage: ((Number(revealedHorse.age || 1) / 10) * 100),
                        max: 10
                      },
                      {
                        label: 'WEIGHT',
                        value: revealedHorse.stats?.weight?.toFixed(0) || '500',
                        unit: 'kg',
                        icon: FaWeight,
                        percentage: (((Number(revealedHorse.stats?.weight || 500) - 300) / (1000 - 300)) * 100),
                        max: 1000
                      },
                      {
                        label: 'DETERMINATION',
                        value: revealedHorse.stats?.determination || '50',
                        unit: '',
                        icon: GiMuscleUp,
                        percentage: Number(revealedHorse.stats?.determination || 50),
                        max: 100
                      },
                      {
                        label: 'BOND',
                        value: revealedHorse.stats?.bond || '0',
                        unit: '',
                        icon: FaHeart,
                        percentage: Number(revealedHorse.stats?.bond || 0),
                        max: 100
                      },
                      {
                        label: 'FAME',
                        value: revealedHorse.stats?.fame || '0',
                        unit: '',
                        icon: FaTrophy,
                        percentage: Number(revealedHorse.stats?.fame || 0),
                        max: 100
                      },
                      {
                        label: 'INSTINCT',
                        value: revealedHorse.stats?.instinct || '50',
                        unit: '',
                        icon: FaBrain,
                        percentage: Number(revealedHorse.stats?.instinct || 50),
                        max: 100
                      },
                      {
                        label: 'ENERGY',
                        value: revealedHorse.stats?.energy || '100',
                        unit: '',
                        icon: FaBolt,
                        percentage: Number(revealedHorse.stats?.energy || 100),
                        max: 100
                      },
                      {
                        label: 'SATIETY',
                        value: revealedHorse.stats?.satiety || '100',
                        unit: '',
                        icon: MdFastfood,
                        percentage: Number(revealedHorse.stats?.satiety || 100),
                        max: 100
                      }
                    ].map((stat, idx) => {
                      const IconComponent = stat.icon;
                      return (
                        <motion.div
                          key={stat.label}
                          initial={{ opacity: 0, x: -50 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{
                            delay: 0.7 + idx * 0.1,
                            type: 'spring',
                            stiffness: 200,
                            damping: 20,
                          }}
                          className="rounded-xl p-4 border relative overflow-hidden group"
                          style={{
                            borderColor: `${revealedHorse.color}40`,
                            background: 'rgba(0, 0, 0, 0.6)',
                          }}
                        >
                          <motion.div
                            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            style={{
                              background: `linear-gradient(135deg, ${revealedHorse.color}15, transparent)`,
                            }}
                          />

                          <div className="flex items-center gap-3 mb-3 relative z-10">
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
                                className="text-lg"
                                style={{ color: revealedHorse.color }}
                              />
                            </motion.div>
                            <div className="flex-1">
                              <p className="text-xs text-gray-500 font-bold tracking-wider">
                                {stat.label}
                              </p>
                              <p className="text-xl font-black" style={{ color: revealedHorse.color }}>
                                {stat.value}
                                {stat.unit && <span className="text-xs text-gray-500 ml-1 font-normal">{stat.unit}</span>}
                              </p>
                            </div>
                          </div>

                          <div className="relative h-2 rounded-full overflow-hidden bg-black/60 z-10">
                            <motion.div
                              className="absolute inset-y-0 left-0 rounded-full"
                              style={{
                                background: `linear-gradient(90deg, ${revealedHorse.color}, ${revealedHorse.color}cc)`,
                                boxShadow: `0 0 10px ${revealedHorse.color}80`,
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
                    transition={{ delay: 1.3 }}
                    className="rounded-2xl p-5 border-2 flex items-center gap-4 relative overflow-hidden"
                    style={{
                      borderColor: `${revealedHorse.color}80`,
                      background: 'rgba(0, 0, 0, 0.7)',
                      boxShadow: `0 0 40px ${revealedHorse.color}60`,
                    }}
                  >
                    <motion.div
                      className="absolute inset-0 opacity-20"
                      style={{
                        background: `linear-gradient(90deg, transparent, ${revealedHorse.color}, transparent)`,
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

                    <motion.div
                    >
                      <SiSolana className="text-3xl flex-shrink-0 relative z-10" style={{ color: revealedHorse.color }} />
                    </motion.div>

                    <div className="flex-1 min-w-0 relative z-10">
                      <p className="text-xs text-gray-400 font-bold mb-1 tracking-wider">NFT SUCCESSFULLY MINTED</p>
                      <p className="text-base font-bold text-white">Solana Blockchain</p>
                    </div>

                    <motion.div
                      className="text-xl"
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
            </motion.div>
              </div>
            </>
          )}
          </motion.div>
        </AnimatePresence>
      )}
    </>
  );
}
