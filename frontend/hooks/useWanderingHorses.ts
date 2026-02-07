'use client';

import { useEffect, useState } from 'react';

interface WanderingPosition {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  direction: 'left' | 'right';
}

export function useWanderingHorses(
  status: string,
  registeredHorses: any[],
  raceStartTime?: string
): Map<string, WanderingPosition> {
  const [wanderingHorses, setWanderingHorses] = useState<Map<string, WanderingPosition>>(new Map());

  useEffect(() => {
    if (status === 'waiting' && registeredHorses.length > 0) {
      setWanderingHorses((prev) => {
        const newPositions = new Map();
        registeredHorses.forEach((horse) => {
          if (prev.has(horse.horse_id)) {
            newPositions.set(horse.horse_id, prev.get(horse.horse_id)!);
          } else {
            const x = 15 + Math.random() * 75;
            const y = 10 + Math.random() * 80;
            const targetX = 15 + Math.random() * 75;
            const targetY = 10 + Math.random() * 80;
            const direction: 'left' | 'right' = targetX > x ? 'right' : 'left';
            newPositions.set(horse.horse_id, { x, y, targetX, targetY, direction });
          }
        });
        return newPositions;
      });
    } else if (status !== 'waiting') {
      setWanderingHorses(new Map());
    }
  }, [status, registeredHorses.length]);

  useEffect(() => {
    if (status !== 'waiting' || registeredHorses.length === 0) return;

    const interval = setInterval(() => {
      setWanderingHorses((prev) => {
        const updated = new Map(prev);
        updated.forEach((pos) => {
          const dx = pos.targetX - pos.x;
          const dy = pos.targetY - pos.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 2) {
            pos.targetX = 15 + Math.random() * 75;
            pos.targetY = 10 + Math.random() * 80;
            pos.direction = pos.targetX > pos.x ? 'right' : 'left';
          } else {
            const speed = 0.15;
            pos.x += (dx / distance) * speed;
            pos.y += (dy / distance) * speed;
            pos.direction = dx > 0 ? 'right' : 'left';
          }
        });
        return updated;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [status, registeredHorses]);

  return wanderingHorses;
}
