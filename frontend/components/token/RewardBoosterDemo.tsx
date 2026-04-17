'use client';

import { useState } from 'react';
import Image from 'next/image';
import PhaseBadge from './PhaseBadge';

interface RewardBoosterDemoProps {
  ticker: string;
  tiers: { holding: number; bonusPct: number }[];
}

const BASE_PRIZE = 1.0;

function formatHolding(n: number): string {
  if (n >= 1_000_000) return `${n / 1_000_000}M`;
  if (n >= 1_000) return `${n / 1_000}K`;
  return `${n}`;
}

export default function RewardBoosterDemo({ ticker, tiers }: RewardBoosterDemoProps) {
  const [selectedIndex, setSelectedIndex] = useState(1);
  const tier = tiers[selectedIndex];
  const boostedPrize = BASE_PRIZE * (1 + tier.bonusPct / 100);

  return (
    <div className="glass-dark rounded-2xl p-6 md:p-8 border border-cyan-500/30">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h3 className="text-2xl font-black text-white">Race Reward Booster</h3>
          <p className="text-sm text-gray-400 mt-1">
            See how {ticker} holdings boost your winnings
          </p>
        </div>
        <PhaseBadge phase="phase-1" />
      </div>

      <div className="flex gap-2 mb-6">
        {tiers.map((t, i) => (
          <button
            key={t.holding}
            onClick={() => setSelectedIndex(i)}
            className={`flex-1 px-3 py-2 rounded-lg text-xs md:text-sm font-bold transition-all border ${
              selectedIndex === i
                ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-[0_0_20px_rgba(0,217,255,0.4)]'
                : 'bg-black/30 border-white/10 text-gray-400 hover:text-white hover:border-cyan-500/40'
            }`}
          >
            {formatHolding(t.holding)} {ticker}
            <span className="block text-[10px] font-semibold opacity-80 mt-0.5">+{t.bonusPct}%</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
        <div className="rounded-xl bg-black/40 border border-white/10 p-5 text-center">
          <div className="text-[10px] uppercase tracking-widest text-gray-500 mb-2">Without {ticker}</div>
          <div className="text-3xl md:text-4xl font-black text-gray-300 font-mono">{BASE_PRIZE.toFixed(2)}</div>
          <div className="text-xs text-gray-500 mt-1">SOL per win</div>
        </div>

        <div className="flex flex-col items-center">
          <span className="text-3xl animate-pulse" style={{ filter: 'drop-shadow(0 0 12px rgba(0,217,255,0.8))' }}>
            →
          </span>
          <span className="mt-1 text-[10px] font-bold text-cyan-300 tracking-wider">BOOSTED</span>
        </div>

        <div
          className="relative rounded-xl p-5 text-center border"
          style={{
            background: 'linear-gradient(135deg, rgba(0,217,255,0.12), rgba(181,55,255,0.12))',
            borderColor: 'rgba(0,217,255,0.4)',
            boxShadow: '0 0 30px rgba(181,55,255,0.25)',
          }}
        >
          <div className="absolute -top-3 -right-3 w-10 h-10">
            <Image
              src="/token/pxl-coin.png"
              alt=""
              fill
              sizes="40px"
              className="drop-shadow-[0_0_10px_rgba(255,221,0,0.7)]"
              style={{ imageRendering: 'pixelated' }}
            />
          </div>
          <div className="text-[10px] uppercase tracking-widest text-cyan-300 mb-2 font-semibold">
            With {formatHolding(tier.holding)} {ticker}
          </div>
          <div
            className="text-3xl md:text-4xl font-black font-mono"
            style={{
              background: 'linear-gradient(135deg, #00d9ff, #b537ff)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {boostedPrize.toFixed(2)}
          </div>
          <div className="text-xs text-cyan-200/80 mt-1">SOL per win (+{tier.bonusPct}%)</div>
        </div>
      </div>
    </div>
  );
}
