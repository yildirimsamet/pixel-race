'use client';

import { useEffect, useState } from 'react';

interface CountdownTimerProps {
  targetISO: string;
  variant?: 'hero' | 'inline' | 'compact';
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
}

function computeTimeLeft(targetMs: number): TimeLeft {
  const total = Math.max(0, targetMs - Date.now());
  const days = Math.floor(total / (1000 * 60 * 60 * 24));
  const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((total / 1000 / 60) % 60);
  const seconds = Math.floor((total / 1000) % 60);
  return { days, hours, minutes, seconds, total };
}

export default function CountdownTimer({ targetISO, variant = 'hero' }: CountdownTimerProps) {
  const targetMs = new Date(targetISO).getTime();
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);

  useEffect(() => {
    setTimeLeft(computeTimeLeft(targetMs));
    const id = setInterval(() => setTimeLeft(computeTimeLeft(targetMs)), 1000);
    return () => clearInterval(id);
  }, [targetMs]);

  if (!timeLeft) {
    return variant === 'hero' ? (
      <div className="h-28 w-full max-w-2xl mx-auto rounded-2xl bg-black/30 animate-pulse" />
    ) : (
      <span className="inline-block h-5 w-40 bg-black/30 rounded animate-pulse" />
    );
  }

  if (timeLeft.total <= 0) {
    if (variant === 'hero') {
      return (
        <div className="relative inline-block px-10 py-5 rounded-2xl bg-gradient-to-r from-emerald-500/20 via-cyan-500/20 to-purple-500/20 border border-emerald-400/40">
          <span className="text-3xl font-black text-emerald-300 tracking-widest">🚀 LAUNCHED</span>
          <span className="block text-sm text-emerald-200/80 mt-1">Live on Pump.fun now</span>
        </div>
      );
    }
    return <span className="font-bold text-emerald-400">🚀 Live on Pump.fun</span>;
  }

  if (variant === 'inline') {
    return (
      <span className="font-mono font-semibold">
        {timeLeft.days}d {String(timeLeft.hours).padStart(2, '0')}h{' '}
        {String(timeLeft.minutes).padStart(2, '0')}m {String(timeLeft.seconds).padStart(2, '0')}s
      </span>
    );
  }

  if (variant === 'compact') {
    return (
      <span className="font-mono text-xs font-bold tracking-wider">
        {timeLeft.days}D {String(timeLeft.hours).padStart(2, '0')}H {String(timeLeft.minutes).padStart(2, '0')}M
      </span>
    );
  }

  const cells = [
    { label: 'Days', value: timeLeft.days },
    { label: 'Hours', value: timeLeft.hours },
    { label: 'Mins', value: timeLeft.minutes },
    { label: 'Secs', value: timeLeft.seconds },
  ];

  return (
    <div className="flex items-center justify-center gap-3 md:gap-4">
      {cells.map((cell, i) => (
        <div key={cell.label} className="flex items-center gap-3 md:gap-4">
          <div className="flex flex-col items-center min-w-[72px] md:min-w-[88px]">
            <div
              className="relative w-full rounded-xl px-3 py-3 md:py-4 text-center border border-cyan-500/30"
              style={{
                background:
                  'linear-gradient(135deg, rgba(0, 217, 255, 0.08), rgba(181, 55, 255, 0.08))',
                boxShadow: '0 0 30px rgba(181, 55, 255, 0.15), inset 0 0 20px rgba(0, 217, 255, 0.05)',
              }}
            >
              <span
                className="block text-3xl md:text-5xl font-black font-mono leading-none"
                style={{
                  background: 'linear-gradient(135deg, #00d9ff, #b537ff)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                {String(cell.value).padStart(2, '0')}
              </span>
            </div>
            <span className="mt-2 text-[10px] md:text-xs uppercase tracking-[0.2em] text-gray-400 font-semibold">
              {cell.label}
            </span>
          </div>
          {i < cells.length - 1 && (
            <span className="text-3xl md:text-4xl font-black text-cyan-500/40 leading-none -translate-y-2">:</span>
          )}
        </div>
      ))}
    </div>
  );
}
