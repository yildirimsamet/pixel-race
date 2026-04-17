'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FiLock } from 'react-icons/fi';
import CountdownTimer from './CountdownTimer';
import { TOKEN_CONFIG, getPhaseStartISO } from '@/lib/tokenConfig';

export default function LockedTier4Card() {
  const phase2ISO = getPhaseStartISO('phase-2');
  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.65, duration: 0.6 }}
      className="h-full"
    >
      <Link
        href="/token"
        className="relative block h-full rounded-2xl overflow-hidden border-2 border-dashed border-yellow-400/50 group"
        style={{ minHeight: 440 }}
      >
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(135deg, rgba(255, 221, 0, 0.08), rgba(181, 55, 255, 0.08), rgba(255, 46, 151, 0.08))',
          }}
        />
        <div className="absolute inset-0 backdrop-blur-[2px]" />
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-yellow-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

        <div className="relative z-10 h-full flex flex-col items-center justify-between p-6 text-center">
          <div className="w-full">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-yellow-400/60 bg-yellow-500/10 text-[10px] uppercase tracking-[0.25em] font-black text-yellow-300 mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
              Phase 2 · Legendary
            </div>
            <div className="relative inline-flex items-center justify-center gap-2 mb-3">
              <span
                className="text-7xl"
                style={{ filter: 'drop-shadow(0 0 24px rgba(255, 221, 0, 0.6))' }}
              >
                🐴
              </span>
              <span className="relative w-14 h-14 -ml-3 -mb-2">
                <Image
                  src="/token/pxl-coin.png"
                  alt={`${TOKEN_CONFIG.displayTicker} coin`}
                  fill
                  sizes="56px"
                  className="drop-shadow-[0_0_14px_rgba(255,221,0,0.7)]"
                  style={{ imageRendering: 'pixelated' }}
                />
              </span>
            </div>
          </div>

          <div className="space-y-3 flex-1 flex flex-col justify-center">
            <h3
              className="text-3xl font-black tracking-wide"
              style={{
                background: 'linear-gradient(135deg, #ffdd00, #ff6b00, #b537ff)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              TIER 4 — LEGENDARY
            </h3>
            <p className="text-sm text-gray-300 max-w-xs mx-auto leading-relaxed">
              The rarest horse breed in Pixel Race. Top-tier stats, exclusive to {TOKEN_CONFIG.displayTicker} holders.
            </p>
            <div className="flex items-center justify-center gap-2 text-xs text-yellow-200/90 font-mono">
              <span className="px-2 py-1 rounded bg-black/40 border border-yellow-400/30">5 SOL</span>
              <span>+</span>
              <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-black/40 border border-yellow-400/30">
                <span className="relative w-4 h-4">
                  <Image
                    src="/token/pxl-coin.png"
                    alt=""
                    fill
                    sizes="16px"
                    style={{ imageRendering: 'pixelated' }}
                  />
                </span>
                50K {TOKEN_CONFIG.displayTicker}
              </span>
            </div>
          </div>

          <div className="w-full space-y-3">
            <div className="flex items-center justify-center gap-2 text-[10px] uppercase tracking-[0.2em] text-gray-400 font-bold">
              <FiLock />
              Unlocks in Phase 2
            </div>
            <div className="rounded-lg bg-black/40 border border-yellow-400/30 px-4 py-3">
              <div className="text-[9px] uppercase tracking-widest text-yellow-200/80 font-bold mb-1">
                Phase 2 drop in
              </div>
              <CountdownTimer targetISO={phase2ISO} variant="inline" />
            </div>
            <div className="text-xs font-bold text-yellow-300 group-hover:text-yellow-200 group-hover:underline">
              Learn more about {TOKEN_CONFIG.displayTicker} →
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
