'use client';

import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

interface HorseProgress {
  horse_id: string;
  horse_name: string;
  progress: number;
  finished: boolean;
  color?: string;
  owner_name?: string;
  speed_score?: number;
}

interface RaceRegistrationData {
  race_id: string;
  horse_name: string;
  registered_count: number;
  max_horses: number;
  timestamp: string;
}

interface ConsolationRewardData {
  race_id: string;
  user_id: string;
  horse_name: string;
  finish_position: number;
  reward_type: string;
  reward_amount: number;
}

interface UseRaceSocketReturn {
  socket: Socket | null;
  horsesProgress: HorseProgress[];
  liveFinishOrder: { horse_id: string; position: number }[];
  registeredCount: number;
}

export function useRaceSocket(
  raceId: string,
  onRaceEnd?: () => void,
  onRaceStart?: () => void,
  onRegistration?: (data: RaceRegistrationData) => void,
  onRaceCancelled?: () => void,
  onGoodLuckUsed?: () => void,
  onConsolationReward?: (data: ConsolationRewardData) => void
): UseRaceSocketReturn {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [horsesProgress, setHorsesProgress] = useState<HorseProgress[]>([]);
  const [liveFinishOrder, setLiveFinishOrder] = useState<{ horse_id: string; position: number }[]>([]);
  const [registeredCount, setRegisteredCount] = useState<number>(0);

  const onRaceEndRef = useRef(onRaceEnd);
  const onRaceStartRef = useRef(onRaceStart);
  const onRegistrationRef = useRef(onRegistration);
  const onRaceCancelledRef = useRef(onRaceCancelled);
  const onGoodLuckUsedRef = useRef(onGoodLuckUsed);
  const onConsolationRewardRef = useRef(onConsolationReward);

  useEffect(() => {
    onRaceEndRef.current = onRaceEnd;
    onRaceStartRef.current = onRaceStart;
    onRegistrationRef.current = onRegistration;
    onRaceCancelledRef.current = onRaceCancelled;
    onGoodLuckUsedRef.current = onGoodLuckUsed;
    onConsolationRewardRef.current = onConsolationReward;
  });

  useEffect(() => {
    const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000';

    const newSocket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    setSocket(newSocket);

    const handleConnect = () => {
      newSocket.emit('joinRace', { race_id: raceId });
    };

    const handleDisconnect = () => {
    };

    const handleError = (error: any) => {
    };

    const handleRaceStart = (data: any) => {
      setHorsesProgress([]);
      setLiveFinishOrder([]);
      onRaceStartRef.current?.();
    };

    const handleRaceProgress = (data: any) => {
      setHorsesProgress(data.horses);

      const finishedHorses = data.horses.filter((h: HorseProgress) => h.finished);
      setLiveFinishOrder(prevOrder => {
        const existingIds = new Set(prevOrder.map(h => h.horse_id));
        const newFinishers = finishedHorses
          .filter((h: HorseProgress) => !existingIds.has(h.horse_id))
          .map((h: HorseProgress) => ({
            horse_id: h.horse_id,
            position: prevOrder.length + 1
          }));
        return [...prevOrder, ...newFinishers];
      });
    };

    const handleRaceEnd = async (data: any) => {
      await new Promise(resolve => setTimeout(resolve, 500));
      onRaceEndRef.current?.();
    };

    const handleRaceState = (data: any) => {
    };

    const handleRaceRegistration = (data: RaceRegistrationData) => {
      setRegisteredCount(data.registered_count);
      onRegistrationRef.current?.(data);
    };

    const handleRaceCancelled = (data: any) => {
      onRaceCancelledRef.current?.();
    };

    const handleGoodluckUsed = (data: any) => {
      onGoodLuckUsedRef.current?.();
    };

    const handleConsolationReward = (data: ConsolationRewardData) => {
      onConsolationRewardRef.current?.(data);
    };

    newSocket.on('connect', handleConnect);
    newSocket.on('disconnect', handleDisconnect);
    newSocket.on('error', handleError);
    newSocket.on('raceStart', handleRaceStart);
    newSocket.on('raceProgress', handleRaceProgress);
    newSocket.on('raceEnd', handleRaceEnd);
    newSocket.on('raceState', handleRaceState);
    newSocket.on('raceRegistration', handleRaceRegistration);
    newSocket.on('raceCancelled', handleRaceCancelled);
    newSocket.on('goodluckUsed', handleGoodluckUsed);
    newSocket.on('consolation-reward', handleConsolationReward);

    return () => {
      newSocket.off('connect', handleConnect);
      newSocket.off('disconnect', handleDisconnect);
      newSocket.off('error', handleError);
      newSocket.off('raceStart', handleRaceStart);
      newSocket.off('raceProgress', handleRaceProgress);
      newSocket.off('raceEnd', handleRaceEnd);
      newSocket.off('raceState', handleRaceState);
      newSocket.off('raceRegistration', handleRaceRegistration);
      newSocket.off('raceCancelled', handleRaceCancelled);
      newSocket.off('goodluckUsed', handleGoodluckUsed);
      newSocket.off('consolation-reward', handleConsolationReward);
      newSocket.emit('leaveRace', { race_id: raceId });
      newSocket.close();
    };
  }, [raceId]);

  return { socket, horsesProgress, liveFinishOrder, registeredCount };
}
