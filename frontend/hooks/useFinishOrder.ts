'use client';

import { useEffect, useState } from 'react';

interface HorseProgress {
  horse_id: string;
  finished: boolean;
}

export function useFinishOrder(horses: HorseProgress[], status: string): Map<string, number> {
  const [finishOrder, setFinishOrder] = useState<Map<string, number>>(new Map());

  useEffect(() => {
    if (status === 'waiting') {
      setFinishOrder(new Map());
    } else if (status === 'racing') {
      horses.forEach((horse) => {
        if (horse.finished) {
          setFinishOrder((prevOrder) => {
            if (!prevOrder.has(horse.horse_id)) {
              const newOrder = new Map(prevOrder);
              newOrder.set(horse.horse_id, newOrder.size + 1);
              return newOrder;
            }
            return prevOrder;
          });
        }
      });
    }
  }, [horses, status]);

  return finishOrder;
}
