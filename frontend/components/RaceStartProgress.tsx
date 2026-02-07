'use client';

import { useEffect, useState, useRef } from 'react';

interface RaceStartProgressProps {
  timeRemaining: number;
  totalDuration?: number;
}

export default function RaceStartProgress({
  timeRemaining,
  totalDuration = 10000
}: RaceStartProgressProps) {
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    const calculateProgress = (remaining: number, total: number): number => {
      const elapsed = total - remaining;
      const linearProgress = (elapsed / total) * 100;

      const t = elapsed / total;
      const easedProgress = t * t * t * 70 + t * 20;

      return Math.min(easedProgress, 95);
    };

    const updateProgress = () => {
      if (timeRemaining > 0) {
        const newProgress = calculateProgress(timeRemaining, totalDuration);
        setProgress(newProgress);
        animationFrameRef.current = requestAnimationFrame(updateProgress);
      } else {
        setProgress(95);
        setTimeout(() => setIsVisible(false), 300);
      }
    };

    updateProgress();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [timeRemaining, totalDuration]);

  if (!isVisible) return null;

  const intensity = Math.min(progress / 80, 1);
  const pulseSpeed = Math.max(2 - intensity * 1.5, 0.5);

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50">
      <div
        className="absolute inset-0 bg-black transition-opacity duration-500"
        style={{
          opacity: 0.3 + (intensity * 0.2)
        }}
      />

      <div className="relative z-10 flex flex-col items-center gap-6">
        <div className="relative w-48 h-48">
          <svg
            className="absolute inset-0 w-full h-full -rotate-90"
            viewBox="0 0 200 200"
          >
            <circle
              cx="100"
              cy="100"
              r="90"
              fill="none"
              stroke="rgba(255, 255, 255, 0.1)"
              strokeWidth="8"
            />
          </svg>

          <svg
            className="absolute inset-0 w-full h-full -rotate-90"
            viewBox="0 0 200 200"
          >
            <defs>
              <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00d9ff" />
                <stop offset="50%" stopColor="#00ff88" />
                <stop offset="100%" stopColor="#ffff00" />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            <circle
              cx="100"
              cy="100"
              r="90"
              fill="none"
              stroke="url(#progressGradient)"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={565.48}
              strokeDashoffset={565.48 - (565.48 * progress) / 100}
              filter="url(#glow)"
              style={{
                transition: 'stroke-dashoffset 0.1s linear',
              }}
            />
          </svg>

          <div
            className="absolute inset-0 rounded-full border-4"
            style={{
              borderColor: `rgba(0, 217, 255, ${0.3 + intensity * 0.4})`,
              boxShadow: `0 0 ${20 + intensity * 40}px rgba(0, 217, 255, ${0.4 + intensity * 0.4})`,
              animation: `race-progress-pulse ${pulseSpeed}s ease-in-out infinite`,
            }}
          />

          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div
              className="text-6xl mb-2"
              style={{
                animation: `race-flag-wave ${pulseSpeed}s ease-in-out infinite`,
                filter: `drop-shadow(0 0 ${10 + intensity * 20}px rgba(255, 255, 255, ${0.5 + intensity * 0.3}))`,
              }}
            >
              🏁
            </div>

            <div
              className="text-xl font-black tracking-wider"
              style={{
                background: 'linear-gradient(135deg, #00d9ff 0%, #00ff88 50%, #ffff00 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                filter: `drop-shadow(0 0 ${8 + intensity * 12}px rgba(0, 255, 136, ${0.6 + intensity * 0.3}))`,
                animation: `race-text-glow ${pulseSpeed}s ease-in-out infinite`,
              }}
            >
              RACE STARTING
            </div>

            <div
              className="text-sm font-semibold text-cyan-400 mt-1"
              style={{
                textShadow: '0 0 10px rgba(0, 217, 255, 0.8)',
              }}
            >
              {Math.round(progress)}%
            </div>
          </div>
        </div>

        <div
          className="text-center text-white/80 text-sm font-semibold tracking-wide px-6 py-2 rounded-full bg-black/40 backdrop-blur-sm border border-white/20"
          style={{
            animation: `race-subtitle-pulse ${pulseSpeed}s ease-in-out infinite`,
            boxShadow: `0 0 ${15 + intensity * 25}px rgba(0, 217, 255, ${0.2 + intensity * 0.3})`,
          }}
        >
          Get ready for the race...
        </div>

        <div className="absolute inset-0 pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 rounded-full bg-cyan-400"
              style={{
                left: '50%',
                top: '50%',
                animation: `race-particle-${i % 3} ${2 + i * 0.3}s ease-out infinite`,
                animationDelay: `${i * 0.2}s`,
                opacity: intensity * 0.6,
                boxShadow: '0 0 10px rgba(0, 217, 255, 0.8)',
              }}
            />
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes race-progress-pulse {
          0%, 100% {
            transform: scale(1);
            opacity: 0.8;
          }
          50% {
            transform: scale(1.05);
            opacity: 1;
          }
        }

        @keyframes race-flag-wave {
          0%, 100% {
            transform: rotate(-5deg) scale(1);
          }
          50% {
            transform: rotate(5deg) scale(1.1);
          }
        }

        @keyframes race-text-glow {
          0%, 100% {
            opacity: 0.9;
          }
          50% {
            opacity: 1;
          }
        }

        @keyframes race-subtitle-pulse {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-3px);
          }
        }

        @keyframes race-particle-0 {
          0% {
            transform: translate(-50%, -50%) translate(0, 0) scale(0);
            opacity: 0;
          }
          20% {
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) translate(60px, -80px) scale(0.5);
            opacity: 0;
          }
        }

        @keyframes race-particle-1 {
          0% {
            transform: translate(-50%, -50%) translate(0, 0) scale(0);
            opacity: 0;
          }
          20% {
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) translate(-60px, -80px) scale(0.5);
            opacity: 0;
          }
        }

        @keyframes race-particle-2 {
          0% {
            transform: translate(-50%, -50%) translate(0, 0) scale(0);
            opacity: 0;
          }
          20% {
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) translate(80px, 60px) scale(0.5);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
