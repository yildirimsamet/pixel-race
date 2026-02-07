'use client';

import { useEffect, useState } from 'react';
import moment from 'moment';

interface UseCountdownReturn {
  timeUntilStart: string;
  isLineup: boolean;
  coundownDone: boolean;
}

export function useCountdown(startTime: string | undefined, status: string): UseCountdownReturn {
  const [timeUntilStart, setTimeUntilStart] = useState('');
  const [isLineup, setIsLineup] = useState(false);
  const [coundownDone, setCoundownDone] = useState(false);

  useEffect(() => {
    if (!startTime || status !== 'waiting') return;

    const updateCountdown = () => {
      const startTimeUTC = moment.utc(startTime);
      const now = moment.utc();
      const diff = startTimeUTC.diff(now);

      if (diff > 0) {
        const duration = moment.duration(diff);
        const hours = Math.floor(duration.asHours());
        const minutes = duration.minutes();
        const seconds = duration.seconds();

        setIsLineup(diff < 10000);

        if (hours > 0) {
          setTimeUntilStart(`${hours}h ${minutes}m ${seconds}s`);
        } else if (minutes > 0) {
          setTimeUntilStart(`${minutes}m ${seconds}s`);
        } else {
          setTimeUntilStart(`${seconds}s`);
        }
      } else {
        setTimeUntilStart('Starting...');
        setIsLineup(false);
        setCoundownDone(true);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [startTime, status]);

  return { timeUntilStart, isLineup, coundownDone };
}
