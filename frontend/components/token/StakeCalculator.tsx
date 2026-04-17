'use client';

import { useMemo, useState } from 'react';
import PhaseBadge from './PhaseBadge';

interface StakeCalculatorProps {
  ticker: string;
  apy: number;
  totalSupply: number;
  treasuryShareOfSupply: number;
  sampleDailySolPool: number;
}

const PRESETS = [1_000, 10_000, 100_000, 1_000_000];

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toFixed(0);
}

function formatSol(n: number): string {
  if (n >= 1) return n.toFixed(3);
  if (n >= 0.01) return n.toFixed(4);
  return n.toFixed(6);
}

export default function StakeCalculator({
  ticker,
  apy,
  totalSupply,
  treasuryShareOfSupply,
  sampleDailySolPool,
}: StakeCalculatorProps) {
  const [amount, setAmount] = useState<number>(10_000);

  const { dailySol, monthlySol, yearlySol, shareOfTreasuryPct } = useMemo(() => {
    const treasurySize = totalSupply * treasuryShareOfSupply;
    const share = Math.min(1, amount / treasurySize);
    const daily = sampleDailySolPool * share;
    return {
      dailySol: daily,
      monthlySol: daily * 30,
      yearlySol: daily * 365,
      shareOfTreasuryPct: share * 100,
    };
  }, [amount, totalSupply, treasuryShareOfSupply, sampleDailySolPool]);

  return (
    <div className="glass-dark rounded-2xl p-6 md:p-8 border border-purple-500/30">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h3 className="text-2xl font-black text-white">Stake Calculator</h3>
          <p className="text-sm text-gray-400 mt-1">
            Estimate your passive SOL income from {ticker} staking
          </p>
        </div>
        <PhaseBadge phase="phase-1" />
      </div>

      <div className="space-y-5">
        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-2">
            Staked {ticker}
          </label>
          <input
            type="number"
            min={0}
            step={1000}
            value={amount}
            onChange={(e) => setAmount(Math.max(0, Number(e.target.value) || 0))}
            className="w-full px-4 py-3 bg-black/40 border border-purple-500/30 rounded-lg text-white font-mono text-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <input
            type="range"
            min={0}
            max={10_000_000}
            step={1000}
            value={Math.min(amount, 10_000_000)}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="w-full mt-3 accent-purple-500"
          />
          <div className="flex flex-wrap gap-2 mt-3">
            {PRESETS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setAmount(p)}
                className="px-3 py-1 text-xs font-semibold rounded-full bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-200 transition-colors"
              >
                {formatNumber(p)}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl bg-black/40 border border-cyan-500/20 p-4 text-center">
            <div className="text-[10px] uppercase tracking-widest text-gray-400 mb-1">Daily</div>
            <div className="font-mono font-bold text-cyan-300">{formatSol(dailySol)} SOL</div>
          </div>
          <div className="rounded-xl bg-black/40 border border-purple-500/20 p-4 text-center">
            <div className="text-[10px] uppercase tracking-widest text-gray-400 mb-1">Monthly</div>
            <div className="font-mono font-bold text-purple-300">{formatSol(monthlySol)} SOL</div>
          </div>
          <div className="rounded-xl bg-black/40 border border-pink-500/20 p-4 text-center">
            <div className="text-[10px] uppercase tracking-widest text-gray-400 mb-1">Yearly</div>
            <div className="font-mono font-bold text-pink-300">{formatSol(yearlySol)} SOL</div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-gray-400 pt-2 border-t border-white/5">
          <span>
            Your share of staking pool:{' '}
            <span className="text-white font-semibold">{shareOfTreasuryPct.toFixed(4)}%</span>
          </span>
          <span>
            Est. APY: <span className="text-emerald-400 font-semibold">~{(apy * 100).toFixed(0)}%</span>
          </span>
        </div>

        <p className="text-[11px] text-gray-500 italic">
          Estimates based on current in-game fee volume; actual rewards vary with race activity.
          Staking contract activates in Phase 1 (T+7d).
        </p>
      </div>
    </div>
  );
}
