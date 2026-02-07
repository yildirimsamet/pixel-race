'use client';

import { useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useRouter, usePathname } from 'next/navigation';
import { toast } from '@/lib/toast';

export default function WalletDisconnectHandler() {
  const { connected, connecting } = useWallet();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (connecting) return;

    if (!connected && !connecting) {
      const protectedRoutes = ['/stable', '/horse/'];
      const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

      if (isProtectedRoute) {
        const timer = setTimeout(() => {
          toast.warning('Wallet disconnected. Redirecting to home...');
          router.push('/');
        }, 500);

        return () => clearTimeout(timer);
      }
    }
  }, [connected, connecting, pathname, router]);

  return null;
}
