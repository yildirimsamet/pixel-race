'use client';

import { useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { toast } from '@/lib/toast';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000';

let socket: Socket | null = null;

export default function GlobalSocketListeners() {
  useEffect(() => {
    if (!socket) {
      socket = io(SOCKET_URL, {
        transports: ['websocket', 'polling'],
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      const handleConnect = () => {
      };

      const handleDisconnect = () => {
      };

      const handleGoodluckUsed = (data: { race_id: string; horse_id: string; horse_name: string; wallet_address?: string }) => {
        const { horse_name } = data;
        toast.info(`🍀 ${horse_name} activated GoodLuck for the race!`, {
          autoClose: 5000,
        });
      };

      socket.on('connect', handleConnect);
      socket.on('disconnect', handleDisconnect);
      socket.on('goodluckUsed', handleGoodluckUsed);
    }

    return () => {
      if (socket) {
        socket.off('connect');
        socket.off('disconnect');
        socket.off('goodluckUsed');
      }
    };
  }, []);

  return null;
}
