import PhaseBadge from './PhaseBadge';
import type { Utility } from '@/lib/tokenConfig';

interface UtilityCardProps {
  utility: Utility;
}

export default function UtilityCard({ utility }: UtilityCardProps) {
  return (
    <div
      className="group relative rounded-2xl p-6 glass-dark border transition-all duration-300 hover:-translate-y-1 overflow-hidden"
      style={{
        borderColor: `${utility.accentColor}40`,
      }}
    >
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-30 transition-opacity duration-500 pointer-events-none"
        style={{
          background: `radial-gradient(circle at 30% 0%, ${utility.accentColor}66, transparent 60%)`,
        }}
      />
      <div
        className="absolute -top-10 -right-10 w-40 h-40 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity"
        style={{ background: utility.accentColor }}
      />

      <div className="relative z-10 flex items-start justify-between mb-4">
        <div
          className="text-5xl transform transition-transform duration-300 group-hover:scale-110"
          style={{
            filter: `drop-shadow(0 0 16px ${utility.accentColor}99)`,
          }}
        >
          {utility.icon}
        </div>
        <PhaseBadge phase={utility.phase} size="sm" />
      </div>

      <div className="relative z-10 space-y-2">
        <h3 className="text-xl font-black text-white">{utility.title}</h3>
        <p className="text-sm font-semibold" style={{ color: utility.accentColor }}>
          {utility.tagline}
        </p>
        <p className="text-sm text-gray-300 leading-relaxed pt-1">{utility.description}</p>
      </div>
    </div>
  );
}
