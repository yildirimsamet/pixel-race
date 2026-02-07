'use client';

import { useEffect, useState } from 'react';
import moment from 'moment';

interface CountdownProps {
  targetTime: string;
  onComplete?: () => void;
  fromRacePage?: boolean;
}

export default function Countdown({ targetTime, onComplete, fromRacePage = false }: CountdownProps) {
  const [timeLeft, setTimeLeft] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0,
    total: 0,
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const target = moment.utc(targetTime);
      const now = moment.utc();
      const diff = target.diff(now);

      if (diff <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0, total: 0 });
        if (onComplete) onComplete();
        return;
      }

      const duration = moment.duration(diff);
      setTimeLeft({
        hours: Math.floor(duration.asHours()),
        minutes: duration.minutes(),
        seconds: duration.seconds(),
        total: diff,
      });
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [targetTime, onComplete]);

  const formatNumber = (num: number) => String(num).padStart(2, '0');

  const progress = timeLeft.total > 0 ? 100 - (timeLeft.total / (24 * 60 * 60 * 1000)) * 100 : 100;

  return (
    <div className={`flex items-center justify-center gap-6 animate-fade-in`}>

      <div className={`text-center group ${fromRacePage ? 'hidden' : ''}`}>
        <div className="relative w-20 h-20 sm:w-24 sm:h-24">
          <svg className="absolute inset-0 transform -rotate-90" width="100%" height="100%">
            <circle
              cx="50%"
              cy="50%"
              r="40%"
              fill="none"
              stroke="rgba(255, 255, 255, 0.1)"
              strokeWidth="4"
            />
            <circle
              cx="50%"
              cy="50%"
              r="40%"
              fill="none"
              stroke="url(#gradient-hours)"
              strokeWidth="4"
              strokeDasharray={`${2 * Math.PI * 40} ${2 * Math.PI * 40}`}
              strokeDashoffset={2 * Math.PI * 40 * (1 - timeLeft.hours / 24)}
              strokeLinecap="round"
              className="transition-all duration-1000"
            />
            <defs>
              <linearGradient id="gradient-hours" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00d9ff" />
                <stop offset="100%" stopColor="#b537ff" />
              </linearGradient>
            </defs>
          </svg>

          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl sm:text-3xl font-bold text-neon-blue text-glow">
              {formatNumber(timeLeft.hours)}
            </span>
          </div>
        </div>
        <p className="text-xs sm:text-sm text-gray-400 mt-2 uppercase tracking-wide">Hours</p>
      </div>

      {fromRacePage ? null : <div className="text-3xl sm:text-4xl font-bold text-neon-purple animate-pulse">:</div>}

      <div className="text-center group">
        <div className="relative w-20 h-20 sm:w-24 sm:h-24">
          <svg className="absolute inset-0 transform -rotate-90" width="100%" height="100%">
            <circle
              cx="50%"
              cy="50%"
              r="40%"
              fill="none"
              stroke="rgba(255, 255, 255, 0.1)"
              strokeWidth="4"
            />
            <circle
              cx="50%"
              cy="50%"
              r="40%"
              fill="none"
              stroke="url(#gradient-minutes)"
              strokeWidth="4"
              strokeDasharray={`${2 * Math.PI * 40} ${2 * Math.PI * 40}`}
              strokeDashoffset={2 * Math.PI * 40 * (1 - timeLeft.minutes / 60)}
              strokeLinecap="round"
              className="transition-all duration-1000"
            />
            <defs>
              <linearGradient id="gradient-minutes" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#b537ff" />
                <stop offset="100%" stopColor="#ff2e97" />
              </linearGradient>
            </defs>
          </svg>

          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl sm:text-3xl font-bold text-neon-purple text-glow">
              {formatNumber(timeLeft.minutes)}
            </span>
          </div>
        </div>
        <p className="text-xs sm:text-sm text-gray-400 mt-2 uppercase tracking-wide">Minutes</p>
      </div>

      <div className={`text-3xl sm:text-4xl font-bold text-neon-pink animate-pulse`}>:</div>

      <div className="text-center group">
        <div className="relative w-20 h-20 sm:w-24 sm:h-24">
          <svg className="absolute inset-0 transform -rotate-90" width="100%" height="100%">
            <circle
              cx="50%"
              cy="50%"
              r="40%"
              fill="none"
              stroke="rgba(255, 255, 255, 0.1)"
              strokeWidth="4"
            />
            <circle
              cx="50%"
              cy="50%"
              r="40%"
              fill="none"
              stroke="url(#gradient-seconds)"
              strokeWidth="4"
              strokeDasharray={`${2 * Math.PI * 40} ${2 * Math.PI * 40}`}
              strokeDashoffset={2 * Math.PI * 40 * (1 - timeLeft.seconds / 60)}
              strokeLinecap="round"
              className="transition-all duration-1000"
            />
            <defs>
              <linearGradient id="gradient-seconds" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ff2e97" />
                <stop offset="100%" stopColor="#00ff88" />
              </linearGradient>
            </defs>
          </svg>

          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl sm:text-3xl font-bold text-neon-pink text-glow">
              {formatNumber(timeLeft.seconds)}
            </span>
          </div>
        </div>
        <p className="text-xs sm:text-sm text-gray-400 mt-2 uppercase tracking-wide">Seconds</p>
      </div>
    </div>
  );
}
