'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FiX } from 'react-icons/fi';
import { TOKEN_CONFIG } from '@/lib/tokenConfig';

const STORAGE_KEY = 'token-banner-dismissed-v1';

export default function TokenLaunchBanner() {
  const [mounted, setMounted] = useState(false);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    setMounted(true);
    setDismissed(localStorage.getItem(STORAGE_KEY) === 'true');
  }, []);

  if (!mounted || dismissed) {
    return null;
  }

  return (
    <div className="relative z-40 w-full overflow-hidden border-b border-cyan-500/30">
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(90deg, rgba(0,217,255,0.15), rgba(181,55,255,0.15), rgba(255,46,151,0.15))',
          backgroundSize: '200% 100%',
          animation: 'gradientShift 8s ease infinite',
        }}
      />

      <div className="relative flex items-center justify-between gap-3 px-4 py-2 md:py-2.5">
        <Link
          href="/token"
          className="flex-1 min-w-0 flex items-center gap-3 group"
        >
          <span className="relative flex-shrink-0 w-8 h-8">
            <Image
              src="/token/pxl-coin.png"
              alt={`${TOKEN_CONFIG.displayTicker} coin`}
              fill
              sizes="32px"
              className="drop-shadow-[0_0_8px_rgba(255,221,0,0.7)]"
              style={{ imageRendering: 'pixelated' }}
            />
          </span>
          <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-400/40 text-[10px] uppercase tracking-widest font-black text-emerald-300">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
              </span>
              Live
            </span>
            <span className="font-black text-white">
              {TOKEN_CONFIG.displayTicker} is trading on
            </span>
            <span
              className="font-black"
              style={{
                background: 'linear-gradient(135deg, #00d9ff, #ff2e97)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Pump.fun
            </span>
            <span className="hidden md:inline text-gray-300">
              · Holders earn up to <span className="font-bold text-yellow-300">+30%</span> race rewards
            </span>
            <span className="font-bold text-cyan-300 group-hover:text-cyan-200 underline-offset-2 group-hover:underline">
              See perks →
            </span>
          </span>
        </Link>

        <button
          type="button"
          onClick={() => {
            localStorage.setItem(STORAGE_KEY, 'true');
            setDismissed(true);
          }}
          className="flex-shrink-0 p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="Dismiss launch banner"
        >
          <FiX className="text-lg" />
        </button>
      </div>
    </div>
  );
}
