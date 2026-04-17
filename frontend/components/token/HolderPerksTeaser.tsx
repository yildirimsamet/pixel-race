'use client';

import Image from 'next/image';
import Link from 'next/link';
import { FiArrowRight } from 'react-icons/fi';
import PhaseBadge from './PhaseBadge';
import { TOKEN_CONFIG } from '@/lib/tokenConfig';

const FEATURED_IDS = ['reward-multiplier', 'stake-to-earn', 'legendary-tier-4'];

export default function HolderPerksTeaser() {
  const featured = FEATURED_IDS
    .map((id) => TOKEN_CONFIG.utilities.find((u) => u.id === id))
    .filter((u): u is (typeof TOKEN_CONFIG.utilities)[number] => Boolean(u));

  return (
    <section className="relative rounded-3xl overflow-hidden border border-purple-500/30">
      <div
        className="absolute inset-0 opacity-80"
        style={{
          background:
            'linear-gradient(135deg, rgba(0,217,255,0.08), rgba(181,55,255,0.08) 50%, rgba(255,46,151,0.08))',
        }}
      />
      <div className="absolute -top-20 -right-20 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl" />
      <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-cyan-500/20 rounded-full blur-3xl" />

      <div className="relative z-10 p-6 md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div className="flex items-start gap-4">
            <div className="relative w-16 h-16 md:w-20 md:h-20 flex-shrink-0 animate-float">
              <Image
                src="/token/pxl-coin.png"
                alt={`${TOKEN_CONFIG.displayTicker} coin`}
                fill
                sizes="80px"
                className="drop-shadow-[0_0_20px_rgba(255,221,0,0.5)]"
                style={{ imageRendering: 'pixelated' }}
              />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/40 text-[10px] uppercase tracking-[0.25em] text-emerald-300 font-bold mb-3">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
                </span>
                Live on Pump.fun
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-white">
                Hold{' '}
                <span
                  style={{
                    background: 'linear-gradient(135deg, #00d9ff, #ff2e97)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  {TOKEN_CONFIG.displayTicker}
                </span>
                , win more SOL
              </h2>
              <p className="text-sm text-gray-400 mt-1">
                Six on-chain utilities across four phases — first ones activating within 7 days.
              </p>
            </div>
          </div>

          <Link
            href="/token"
            className="btn-neon inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white font-bold text-sm"
          >
            See all utilities <FiArrowRight />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {featured.map((u) => (
            <Link
              key={u.id}
              href="/token"
              className="group relative rounded-xl p-5 bg-black/40 border transition-all duration-300 hover:-translate-y-0.5"
              style={{ borderColor: `${u.accentColor}40` }}
            >
              <div className="flex items-center justify-between mb-3">
                <span
                  className="text-3xl transform group-hover:scale-110 transition-transform"
                  style={{ filter: `drop-shadow(0 0 12px ${u.accentColor}99)` }}
                >
                  {u.icon}
                </span>
                <PhaseBadge phase={u.phase} size="sm" />
              </div>
              <div className="font-bold text-white text-sm mb-1">{u.title}</div>
              <div className="text-xs text-gray-400 leading-snug">{u.tagline}</div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
