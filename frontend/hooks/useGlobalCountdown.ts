import { useState, useEffect } from 'react';

let globalNow = Date.now();
let listeners = new Set<(now: number) => void>();
let intervalId: NodeJS.Timeout | null = null;

function startGlobalInterval() {
  if (intervalId) return;

  intervalId = setInterval(() => {
    globalNow = Date.now();
    listeners.forEach(listener => listener(globalNow));
  }, 1000);
}

function stopGlobalInterval() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

export function useGlobalCountdown(): number {
  const [now, setNow] = useState(globalNow);

  useEffect(() => {
    const listener = (newNow: number) => setNow(newNow);
    listeners.add(listener);

    if (listeners.size === 1) {
      startGlobalInterval();
    }

    return () => {
      listeners.delete(listener);
      if (listeners.size === 0) {
        stopGlobalInterval();
      }
    };
  }, []);

  return now;
}
