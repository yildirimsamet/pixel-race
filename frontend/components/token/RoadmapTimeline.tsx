import type { RoadmapPhase } from '@/lib/tokenConfig';

interface RoadmapTimelineProps {
  phases: RoadmapPhase[];
}

const STATUS_META: Record<RoadmapPhase['status'], { icon: string; color: string; label: string }> = {
  'done': { icon: '✅', color: '#00ff88', label: 'Done' },
  'in-progress': { icon: '🟡', color: '#ffdd00', label: 'In Progress' },
  'planned': { icon: '⚪', color: '#6b7280', label: 'Planned' },
};

export default function RoadmapTimeline({ phases }: RoadmapTimelineProps) {
  return (
    <div className="relative max-w-4xl mx-auto">
      <div
        className="absolute left-6 top-3 bottom-3 w-0.5 hidden md:block"
        style={{
          background:
            'linear-gradient(180deg, #00d9ff 0%, #b537ff 50%, #ff2e97 100%)',
          boxShadow: '0 0 12px rgba(181, 55, 255, 0.5)',
        }}
      />

      <div className="space-y-6">
        {phases.map((phase) => {
          const meta = STATUS_META[phase.status];
          return (
            <div key={phase.key} className="relative flex gap-4 md:gap-6">
              <div className="relative flex-shrink-0 hidden md:flex w-12 h-12 rounded-full items-center justify-center text-2xl glass-dark border-2"
                style={{ borderColor: meta.color, boxShadow: `0 0 20px ${meta.color}66` }}
              >
                {meta.icon}
              </div>

              <div
                className="flex-1 rounded-2xl glass-dark p-6 border"
                style={{ borderColor: `${meta.color}40` }}
              >
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <span className="md:hidden text-2xl">{meta.icon}</span>
                  <h3 className="text-xl font-black text-white">{phase.title}</h3>
                  <span
                    className="px-2 py-0.5 text-xs font-bold rounded-full border"
                    style={{
                      borderColor: `${meta.color}66`,
                      color: meta.color,
                      backgroundColor: `${meta.color}15`,
                    }}
                  >
                    {phase.eta}
                  </span>
                </div>
                <ul className="space-y-2">
                  {phase.milestones.map((m, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                      <span className="mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: meta.color }} />
                      <span>{m}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
