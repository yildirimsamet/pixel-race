'use client';

import { useEffect, useState } from 'react';

export function useLineupCountdown(status: string, raceStartTime?: string): number | null {
  const [lineupCountdown, setLineupCountdown] = useState<number | null>(null);

  useEffect(() => {
    if (status === 'waiting' && raceStartTime) {
      const interval = setInterval(() => {
        const startTimeUTC = new Date(raceStartTime + 'Z').getTime();
        const now = Date.now();
        const diff = startTimeUTC - now;

        if (diff < 10000 && diff > 0) {
          setLineupCountdown(Math.ceil(diff / 1000));
        } else {
          setLineupCountdown(null);
        }
      }, 100);

      return () => clearInterval(interval);
    } else {
      setLineupCountdown(null);
    }
  }, [status, raceStartTime]);

  return lineupCountdown;
}
