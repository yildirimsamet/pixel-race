import type { Phase } from '@/lib/tokenConfig';

interface PhaseBadgeProps {
  phase: Phase;
  size?: 'sm' | 'md';
}

const PHASE_META: Record<Phase, { label: string; bg: string; border: string; text: string; dot: string }> = {
  'live': {
    label: 'LIVE NOW',
    bg: 'bg-emerald-500/15',
    border: 'border-emerald-400/60',
    text: 'text-emerald-300',
    dot: 'bg-emerald-400',
  },
  'phase-1': {
    label: 'Phase 1 · T+7d',
    bg: 'bg-cyan-500/15',
    border: 'border-cyan-400/60',
    text: 'text-cyan-300',
    dot: 'bg-cyan-400',
  },
  'phase-2': {
    label: 'Phase 2 · T+30d',
    bg: 'bg-purple-500/15',
    border: 'border-purple-400/60',
    text: 'text-purple-300',
    dot: 'bg-purple-400',
  },
  'phase-3': {
    label: 'Phase 3 · T+90d',
    bg: 'bg-pink-500/15',
    border: 'border-pink-400/60',
    text: 'text-pink-300',
    dot: 'bg-pink-400',
  },
};

export default function PhaseBadge({ phase, size = 'md' }: PhaseBadgeProps) {
  const meta = PHASE_META[phase];
  const padding = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-bold uppercase tracking-wider ${meta.bg} ${meta.border} ${meta.text} ${padding}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${meta.dot} ${phase === 'live' ? 'animate-pulse' : ''}`} />
      {meta.label}
    </span>
  );
}
