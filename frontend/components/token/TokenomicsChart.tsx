import type { TokenomicsSlice } from '@/lib/tokenConfig';

interface TokenomicsChartProps {
  slices: TokenomicsSlice[];
  totalSupply: number;
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arcPath(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y} Z`;
}

function formatSupply(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(n % 1_000_000_000 === 0 ? 0 : 2)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(0)}M`;
  return n.toLocaleString();
}

export default function TokenomicsChart({ slices, totalSupply }: TokenomicsChartProps) {
  const cx = 100;
  const cy = 100;
  const r = 85;

  let angle = 0;
  const pieces = slices.map((s) => {
    const sweep = (s.pct / 100) * 360;
    const startAngle = angle;
    const endAngle = angle + sweep;
    angle = endAngle;
    const path = arcPath(cx, cy, r, startAngle, endAngle);
    return { ...s, path };
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center max-w-4xl mx-auto">
      <div className="relative">
        <svg viewBox="0 0 200 200" className="w-full max-w-xs mx-auto drop-shadow-[0_0_30px_rgba(181,55,255,0.3)]">
          {pieces.map((p) => (
            <path
              key={p.label}
              d={p.path}
              fill={p.color}
              fillOpacity={0.85}
              stroke="#0a0a0f"
              strokeWidth={2}
            />
          ))}
          <circle cx={cx} cy={cy} r={45} fill="#0a0a0f" />
          <text x={cx} y={cy - 6} textAnchor="middle" className="fill-white" style={{ fontSize: 12, fontWeight: 700 }}>
            TOTAL SUPPLY
          </text>
          <text x={cx} y={cy + 14} textAnchor="middle" className="fill-cyan-300" style={{ fontSize: 20, fontWeight: 900 }}>
            {formatSupply(totalSupply)}
          </text>
        </svg>
      </div>

      <div className="space-y-3">
        {slices.map((s) => (
          <div key={s.label} className="flex items-center gap-3">
            <span className="w-4 h-4 rounded flex-shrink-0" style={{ background: s.color, boxShadow: `0 0 12px ${s.color}88` }} />
            <div className="flex-1 flex items-baseline justify-between gap-2">
              <span className="text-sm font-semibold text-white">{s.label}</span>
              <span className="text-sm font-mono font-bold" style={{ color: s.color }}>
                {s.pct}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
