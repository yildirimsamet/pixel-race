'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FiArrowUp } from 'react-icons/fi';
import { GiHorseHead, GiTwoCoins, GiTrophy } from 'react-icons/gi';

interface LiveStatsStripProps {
  horsesMinted: number;
  solDistributed: number;
  racers: number;
}

interface PersistedStats {
  h: number;
  s: number;
  r: number;
  t: number;
}

const STORAGE_KEY = 'pxl-live-stats-v1';
const FIRST_TICK_MIN_MS = 3_000;
const FIRST_TICK_MAX_MS = 5_000;
const TICK_MIN_MS = 10_000;
const TICK_MAX_MS = 25_000;
const FLASH_DURATION_MS = 2500;

function randRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function randInt(min: number, max: number): number {
  return Math.floor(randRange(min, max + 1));
}

function formatInt(n: number): string {
  return Math.floor(n).toLocaleString('en-US');
}

function formatSol(n: number): string {
  return n.toFixed(2);
}

function readPersisted(): PersistedStats | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      typeof parsed?.h === 'number' &&
      typeof parsed?.s === 'number' &&
      typeof parsed?.r === 'number' &&
      typeof parsed?.t === 'number'
    ) {
      return parsed as PersistedStats;
    }
  } catch {
    // ignore
  }
  return null;
}

function writePersisted(state: PersistedStats): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore quota errors
  }
}

interface RollingValueProps {
  value: string;
  color: string;
}

function RollingValue({ value, color }: RollingValueProps) {
  return (
    <span className="relative inline-block overflow-hidden align-bottom" style={{ minWidth: '1ch' }}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={value}
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: '0%', opacity: 1 }}
          exit={{ y: '-100%', opacity: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="inline-block tabular-nums"
          style={{ color }}
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

interface StatItemProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
  delta: string | null;
}

function StatItem({ icon, label, value, color, delta }: StatItemProps) {
  return (
    <div
      className="relative flex items-center gap-3 px-5 py-3 rounded-xl glass-dark border flex-1 min-w-[200px]"
      style={{
        borderColor: `${color}40`,
        boxShadow: `0 0 20px ${color}22`,
      }}
    >
      <span
        className="text-3xl flex-shrink-0"
        style={{ color, filter: `drop-shadow(0 0 8px ${color})` }}
      >
        {icon}
      </span>
      <div className="text-left flex-1 min-w-0">
        <div className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold">
          {label}
        </div>
        <div className="text-xl font-black font-mono leading-tight h-7 flex items-end">
          <RollingValue value={value} color="#ffffff" />
        </div>
      </div>

      <AnimatePresence>
        {delta && (
          <motion.div
            key={delta}
            initial={{ opacity: 0, y: 6, scale: 0.8 }}
            animate={{ opacity: 1, y: -4, scale: 1 }}
            exit={{ opacity: 0, y: -14, scale: 0.9 }}
            transition={{ duration: 0.35 }}
            className="absolute top-1 right-2 flex items-center gap-0.5 text-[11px] font-black text-emerald-400 pointer-events-none"
            style={{ filter: 'drop-shadow(0 0 6px rgba(16, 185, 129, 0.7))' }}
          >
            <FiArrowUp className="text-xs" />
            <span>+{delta}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function LiveStatsStrip({
  horsesMinted,
  solDistributed,
  racers,
}: LiveStatsStripProps) {
  const [stats, setStats] = useState({
    h: horsesMinted,
    s: solDistributed,
    r: racers,
  });
  const [deltas, setDeltas] = useState<{ h: string | null; s: string | null; r: string | null }>({
    h: null,
    s: null,
    r: null,
  });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flashTimersRef = useRef<{
    h: ReturnType<typeof setTimeout> | null;
    s: ReturnType<typeof setTimeout> | null;
    r: ReturnType<typeof setTimeout> | null;
  }>({ h: null, s: null, r: null });

  useEffect(() => {
    const persisted = readPersisted();
    if (persisted) {
      setStats({
        h: Math.max(persisted.h, horsesMinted),
        s: Math.max(persisted.s, solDistributed),
        r: Math.max(persisted.r, racers),
      });
    } else {
      writePersisted({
        h: horsesMinted,
        s: solDistributed,
        r: racers,
        t: Date.now(),
      });
    }

    const flash = (key: 'h' | 's' | 'r', label: string) => {
      setDeltas((prev) => ({ ...prev, [key]: label }));
      if (flashTimersRef.current[key]) clearTimeout(flashTimersRef.current[key]!);
      flashTimersRef.current[key] = setTimeout(() => {
        setDeltas((prev) => ({ ...prev, [key]: null }));
      }, FLASH_DURATION_MS);
    };

    const tick = () => {
      const dh = randInt(1, 2);
      const ds = randRange(0.2, 0.4);
      const dr = randInt(2, 5);

      setStats((prev) => {
        const next = { h: prev.h + dh, s: prev.s + ds, r: prev.r + dr };
        writePersisted({ ...next, t: Date.now() });
        return next;
      });

      flash('h', String(dh));
      flash('s', ds.toFixed(2));
      flash('r', String(dr));
    };

    const scheduleNext = (first: boolean) => {
      const delay = first
        ? randRange(FIRST_TICK_MIN_MS, FIRST_TICK_MAX_MS)
        : randRange(TICK_MIN_MS, TICK_MAX_MS);
      timerRef.current = setTimeout(() => {
        tick();
        scheduleNext(false);
      }, delay);
    };

    scheduleNext(true);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      (['h', 's', 'r'] as const).forEach((k) => {
        const t = flashTimersRef.current[k];
        if (t) clearTimeout(t);
      });
    };
  }, [horsesMinted, solDistributed, racers]);

  const items: { key: 'h' | 's' | 'r'; icon: React.ReactNode; label: string; value: string; color: string }[] = [
    {
      key: 'h',
      icon: <GiHorseHead />,
      label: 'Horses Minted',
      value: formatInt(stats.h),
      color: '#00d9ff',
    },
    {
      key: 's',
      icon: <GiTwoCoins />,
      label: 'SOL Distributed',
      value: formatSol(stats.s),
      color: '#ffdd00',
    },
    {
      key: 'r',
      icon: <GiTrophy />,
      label: 'Racers',
      value: formatInt(stats.r),
      color: '#ff2e97',
    },
  ];

  return (
    <div className="flex flex-wrap items-stretch justify-center gap-3 md:gap-4 max-w-3xl mx-auto">
      {items.map((item) => (
        <StatItem
          key={item.label}
          icon={item.icon}
          label={item.label}
          value={item.value}
          color={item.color}
          delta={deltas[item.key]}
        />
      ))}
    </div>
  );
}
