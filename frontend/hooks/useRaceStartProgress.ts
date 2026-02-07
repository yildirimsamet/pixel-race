'use client';

import { useEffect, useState } from 'react';

interface RaceStartProgressData {
  isActive: boolean;
  timeRemaining: number;
  totalDuration: number;
}

export function useRaceStartProgress(
  status: string,
  raceStartTime?: string
): RaceStartProgressData {
  const [progressData, setProgressData] = useState<RaceStartProgressData>({
    isActive: false,
    timeRemaining: 0,
    totalDuration: 10000,
  });

  useEffect(() => {
    if (status !== 'waiting') {
      setProgressData({
        isActive: false,
        timeRemaining: 0,
        totalDuration: 10000,
      });
      return;
    }

    if (status === 'waiting' && raceStartTime) {
      const totalDuration = 10000;

      const interval = setInterval(() => {
        const startTimeUTC = new Date(raceStartTime + 'Z').getTime();
        const now = Date.now();
        const diff = startTimeUTC - now;

        if (diff < totalDuration && diff > -3000) {
          setProgressData({
            isActive: true,
            timeRemaining: Math.max(diff, 0),
            totalDuration,
          });
        } else {
          setProgressData({
            isActive: false,
            timeRemaining: 0,
            totalDuration,
          });
        }
      }, 50);

      return () => clearInterval(interval);
    }
  }, [status, raceStartTime]);

  return progressData;
}
