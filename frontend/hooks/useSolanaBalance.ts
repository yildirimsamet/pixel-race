import { useState, useEffect } from 'react';
import { useConnection } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';

const LAMPORTS_PER_SOL = 1_000_000_000;

export function useSolanaBalance(publicKey: PublicKey | null, connected: boolean): number {
  const [balance, setBalance] = useState(0);
  const { connection } = useConnection();

  useEffect(() => {
    if (!connected || !publicKey) {
      setBalance(0);
      return;
    }

    let isMounted = true;

    const fetchBalance = async () => {
      try {
        const balanceInLamports = await connection.getBalance(publicKey);
        if (isMounted) {
          setBalance(balanceInLamports / LAMPORTS_PER_SOL);
        }
      } catch (error) {
        if (isMounted) {
          setBalance(0);
        }
      }
    };

    fetchBalance();

    const interval = setInterval(fetchBalance, 10000);

    return () => {
      clearInterval(interval);
      isMounted = false;
    };
  }, [connected, publicKey, connection]);

  return balance;
}
