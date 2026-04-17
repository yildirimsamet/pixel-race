'use client';

import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import { FiChevronDown, FiCopy, FiExternalLink } from 'react-icons/fi';
import { GiHorseHead } from 'react-icons/gi';
import { FaTwitter, FaDiscord, FaTelegramPlane } from 'react-icons/fa';
import { toast } from 'react-toastify';
import Loader from '@/components/Loader';
import CountdownTimer from '@/components/token/CountdownTimer';
import UtilityCard from '@/components/token/UtilityCard';
import TokenomicsChart from '@/components/token/TokenomicsChart';
import RoadmapTimeline from '@/components/token/RoadmapTimeline';
import StakeCalculator from '@/components/token/StakeCalculator';
import RewardBoosterDemo from '@/components/token/RewardBoosterDemo';
import LiveStatsStrip from '@/components/token/LiveStatsStrip';
import {
  TOKEN_CONFIG,
  getSnapshotDeadlineISO,
  isSnapshotWindowOpen,
} from '@/lib/tokenConfig';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface TokenInfo {
  token_name: string;
  contract_address: string;
  token_url: string;
  description?: string;
  updated_at: string;
}

export default function TokenPage() {
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [snapshotOpen, setSnapshotOpen] = useState(false);
  const snapshotDeadlineISO = getSnapshotDeadlineISO();

  useEffect(() => {
    setSnapshotOpen(isSnapshotWindowOpen());
    const id = setInterval(() => setSnapshotOpen(isSnapshotWindowOpen()), 30_000);
    return () => clearInterval(id);
  }, []);

  const fetchTokenInfo = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_URL}/token/info`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      if (response.ok) {
        const data = await response.json();
        setTokenInfo(data);
      }
    } catch (err) {
      console.error('Error fetching token info:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTokenInfo();
  }, [fetchTokenInfo]);

  const handleCopyContract = () => {
    if (!tokenInfo?.contract_address) {
      toast.info('Contract address will be available at launch');
      return;
    }
    navigator.clipboard.writeText(tokenInfo.contract_address);
    toast.success('Contract address copied!');
  };

  const pumpFunUrl = tokenInfo?.token_url || TOKEN_CONFIG.social.pumpFun;

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <Loader text="Loading token information..." size="lg" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-20 animate-fade-in">
      {/* ---------- HERO + COUNTDOWN ---------- */}
      <section className="relative overflow-hidden rounded-3xl p-5 md:p-8">
        <div
          className="absolute inset-0 bg-gradient-to-br from-purple-900/40 via-pink-900/40 to-cyan-900/40"
          style={{ backgroundSize: '400% 400%', animation: 'gradientShift 15s ease infinite' }}
        />
        <div className="absolute inset-0" style={{ boxShadow: 'inset 0 0 120px rgba(147, 51, 234, 0.3)' }} />
        <div className="absolute top-10 left-10 w-32 h-32 bg-cyan-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

        <div className="relative z-10 text-center space-y-5">
          <div className="flex justify-center">
            <div className="relative w-24 h-24 md:w-32 md:h-32 animate-float">
              <div
                className="absolute inset-0 rounded-full blur-3xl opacity-60"
                style={{ background: 'radial-gradient(circle, rgba(255,221,0,0.55), transparent 70%)' }}
              />
              <Image
                src="/token/pxl-coin.png"
                alt={`${TOKEN_CONFIG.displayTicker} coin`}
                fill
                priority
                sizes="(max-width: 768px) 96px, 128px"
                className="relative drop-shadow-[0_0_32px_rgba(255,221,0,0.6)]"
                style={{ imageRendering: 'pixelated' }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <h1
              className="text-4xl md:text-6xl font-black"
              style={{
                background: 'linear-gradient(135deg, #00d9ff 0%, #b537ff 50%, #ff2e97 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                filter: 'drop-shadow(0 0 20px rgba(181, 55, 255, 0.8))',
              }}
            >
              {tokenInfo?.token_name || TOKEN_CONFIG.name}
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              {tokenInfo?.description || TOKEN_CONFIG.tagline}
            </p>
          </div>

          <div className="pt-2">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-400/40 text-xs uppercase tracking-[0.2em] text-emerald-300 font-bold">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
              </span>
              Live on Pump.fun · Trading now
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            {pumpFunUrl ? (
              <a
                href={pumpFunUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-neon inline-flex items-center gap-2 px-6 py-3.5 rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-black font-black text-base shadow-[0_0_30px_rgba(16,185,129,0.45)]"
              >
                <FiExternalLink />
                Buy {TOKEN_CONFIG.displayTicker} on Pump.fun
              </a>
            ) : (
              <span className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-black/40 border border-white/10 text-gray-300 text-sm italic">
                Pump.fun link coming shortly
              </span>
            )}
            <button
              onClick={handleCopyContract}
              disabled={!tokenInfo?.contract_address}
              className="btn-neon inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FiCopy />
              {tokenInfo?.contract_address ? 'Copy Contract' : 'Contract Pending'}
            </button>
            <a
              href={TOKEN_CONFIG.social.twitter}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-colors"
            >
              <FaTwitter />
            </a>
            <a
              href={TOKEN_CONFIG.social.discord}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-3 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-400/30 text-indigo-200 transition-colors"
            >
              <FaDiscord />
            </a>
            <a
              href={TOKEN_CONFIG.social.telegram}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-3 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 border border-sky-400/30 text-sky-200 transition-colors"
            >
              <FaTelegramPlane />
            </a>
          </div>

          <div className="pt-3">
            <LiveStatsStrip
              horsesMinted={TOKEN_CONFIG.liveStats.horsesMinted}
              solDistributed={TOKEN_CONFIG.liveStats.solDistributed}
              racers={TOKEN_CONFIG.liveStats.racers}
            />
            <p className="text-xs text-gray-400 mt-2 italic">
              Real on-chain activity — the game is already live. {TOKEN_CONFIG.displayTicker} plugs into this economy.
            </p>
          </div>
        </div>
      </section>

      {/* ---------- UTILITIES ---------- */}
      <section className="space-y-8">
        <div className="text-center space-y-3">
          <h2 className="text-4xl md:text-5xl font-black text-white">
            Why hold <span style={{
              background: 'linear-gradient(135deg, #00d9ff, #ff2e97)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>{TOKEN_CONFIG.displayTicker}</span>?
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Six concrete utilities across four launch phases. No vaporware — each one plugs into the live racing economy.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-6xl mx-auto">
          {TOKEN_CONFIG.utilities.map((u) => (
            <UtilityCard key={u.id} utility={u} />
          ))}
        </div>
      </section>

      {/* ---------- REWARD BOOSTER DEMO + STAKE CALC ---------- */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-6xl mx-auto">
        <RewardBoosterDemo
          ticker={TOKEN_CONFIG.displayTicker}
          tiers={TOKEN_CONFIG.rewardBoosterTiers}
        />
        <StakeCalculator
          ticker={TOKEN_CONFIG.displayTicker}
          apy={TOKEN_CONFIG.stakeDefaults.apy}
          totalSupply={TOKEN_CONFIG.totalSupply}
          treasuryShareOfSupply={TOKEN_CONFIG.stakeDefaults.treasuryShareOfSupply}
          sampleDailySolPool={TOKEN_CONFIG.stakeDefaults.sampleDailySolPool}
        />
      </section>

      {/* ---------- TOKENOMICS ---------- */}
      <section className="space-y-8">
        <div className="text-center space-y-3">
          <h2 className="text-4xl md:text-5xl font-black text-white">Tokenomics</h2>
          <p className="text-gray-400">Fair launch. Transparent. No insider deals.</p>
        </div>
        <TokenomicsChart slices={TOKEN_CONFIG.tokenomics} totalSupply={TOKEN_CONFIG.totalSupply} />

        <div className="flex flex-wrap justify-center gap-2 max-w-3xl mx-auto">
          {TOKEN_CONFIG.fairLaunchBadges.map((b) => (
            <span
              key={b}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-emerald-400/40 bg-emerald-500/10 text-xs font-bold text-emerald-300 uppercase tracking-wider"
            >
              ✓ {b}
            </span>
          ))}
        </div>
      </section>

      {/* ---------- ROADMAP ---------- */}
      <section className="space-y-8">
        <div className="text-center space-y-3">
          <h2 className="text-4xl md:text-5xl font-black text-white">Roadmap</h2>
          <p className="text-gray-400">Four phases. Clear dates. Execution already in motion.</p>
        </div>
        <RoadmapTimeline phases={TOKEN_CONFIG.roadmap} />
      </section>

      {/* ---------- FOMO STRIP ---------- */}
      <section className={`grid grid-cols-1 ${snapshotOpen ? 'md:grid-cols-2' : ''} gap-6 max-w-6xl mx-auto`}>
        {snapshotOpen && (
          <div
            className="relative rounded-2xl p-6 md:p-8 border border-yellow-400/40 overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(255, 221, 0, 0.08), rgba(255, 107, 0, 0.08))',
            }}
          >
            <div className="absolute -top-10 -right-10 w-48 h-48 bg-yellow-500/20 rounded-full blur-3xl" />
            <div className="relative z-10 space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-4xl">📸</span>
                <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-red-500/20 border border-red-400/40 text-[10px] uppercase tracking-widest font-black text-red-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                  Window closing
                </span>
              </div>
              <h3 className="text-2xl font-black text-white">OG Racer Snapshot</h3>
              <p className="text-gray-300">
                Hold at least <span className="font-bold text-yellow-300">1,000 {TOKEN_CONFIG.displayTicker}</span>{' '}
                when the T+24h snapshot fires, and receive a free{' '}
                <span className="font-bold text-yellow-300">OG Racer NFT badge</span> airdropped to your wallet.
              </p>
              <div className="rounded-lg bg-black/40 border border-yellow-400/30 px-4 py-3 inline-block">
                <div className="text-[10px] uppercase tracking-widest text-yellow-200 font-bold mb-1">Snapshot in</div>
                <CountdownTimer targetISO={snapshotDeadlineISO} variant="inline" />
              </div>
              <p className="text-xs text-yellow-200/80">
                Badges stack with Bronze/Silver/Gold holder rank rewards.
              </p>
            </div>
          </div>
        )}

        <div className="relative rounded-2xl p-6 md:p-8 border border-purple-400/40 overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(181, 55, 255, 0.08), rgba(255, 46, 151, 0.08))',
          }}
        >
          <div className="absolute -top-10 -right-10 w-48 h-48 bg-pink-500/20 rounded-full blur-3xl" />
          <div className="relative z-10 space-y-4">
            <div className="text-5xl">🏅</div>
            <h3 className="text-2xl font-black text-white">Early Bird Ranks</h3>
            <div className="space-y-2">
              {TOKEN_CONFIG.earlyBird.map((eb) => (
                <div
                  key={eb.tier}
                  className="flex items-center justify-between gap-3 rounded-lg px-3 py-2 bg-black/40 border"
                  style={{ borderColor: `${eb.color}66` }}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{eb.icon}</span>
                    <span className="font-bold text-white">{eb.tier} Holder</span>
                  </div>
                  <span className="text-xs text-gray-300 font-semibold">{eb.cutoff}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ---------- FAQ ---------- */}
      <section className="space-y-8 max-w-4xl mx-auto">
        <div className="text-center space-y-3">
          <h2 className="text-4xl md:text-5xl font-black text-white">FAQ</h2>
        </div>
        <div className="space-y-3">
          {TOKEN_CONFIG.faq.map((item, i) => {
            const open = openFaq === i;
            return (
              <div
                key={i}
                className="rounded-xl glass-dark border border-purple-500/20 overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(open ? null : i)}
                  className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-white/5 transition-colors"
                >
                  <span className="font-semibold text-white">{item.q}</span>
                  <FiChevronDown
                    className={`flex-shrink-0 text-purple-400 transition-transform ${open ? 'rotate-180' : ''}`}
                  />
                </button>
                {open && (
                  <div className="px-5 pb-4 text-sm text-gray-300 leading-relaxed border-t border-white/5 pt-3">
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ---------- CONTRACT + DISCLAIMER ---------- */}
      <section className="max-w-4xl mx-auto space-y-4">
        {tokenInfo?.contract_address && (
          <div className="glass-dark rounded-xl p-5 border border-cyan-500/20">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-3">
                <GiHorseHead className="text-2xl text-cyan-400" />
                <div>
                  <div className="text-xs uppercase tracking-widest text-gray-400 font-semibold">Contract Address</div>
                  <div className="font-mono text-sm text-white break-all">{tokenInfo.contract_address}</div>
                </div>
              </div>
              <button
                onClick={handleCopyContract}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-400/30 text-cyan-200 text-sm font-semibold transition-colors"
              >
                <FiCopy /> Copy
              </button>
            </div>
          </div>
        )}

        <p className="text-xs text-gray-500 text-center italic leading-relaxed">
          {TOKEN_CONFIG.displayTicker} is a utility token for the Pixel Race game economy.
          Nothing on this page is financial advice. Cryptocurrencies are volatile — only
          participate with funds you can afford to lose. Always verify the official contract
          address via our Discord/Twitter before purchasing.
        </p>
      </section>
    </div>
  );
}
