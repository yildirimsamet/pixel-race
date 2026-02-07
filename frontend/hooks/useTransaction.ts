
import { useState, useCallback } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Transaction, PublicKey } from '@solana/web3.js';
import { confirmTransaction } from '@/lib/solana-transactions';
import { estimateTransactionFee, lamportsToSol } from '@/lib/solana-fees';
import { parseTransactionError, getErrorSeverity } from '@/lib/solana-errors';
import { toast } from '@/lib/toast';

type TransactionStatus = 'idle' | 'estimating' | 'pending' | 'confirming' | 'confirmed' | 'failed';

interface TransactionState {
  loading: boolean;
  error: string | null;
  signature: string | null;
  confirmed: boolean;
  status: TransactionStatus;
  estimatedFee: number | null;
}

export function useTransaction() {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();

  const [state, setState] = useState<TransactionState>({
    loading: false,
    error: null,
    signature: null,
    confirmed: false,
    status: 'idle',
    estimatedFee: null,
  });

  const estimateFee = useCallback(
    async (transaction: Transaction): Promise<number> => {
      setState(prev => ({ ...prev, status: 'estimating', loading: true }));

      try {
        const feeInLamports = await estimateTransactionFee(connection, transaction);
        const feeInSol = lamportsToSol(feeInLamports);

        setState(prev => ({
          ...prev,
          estimatedFee: feeInSol,
          status: 'idle',
          loading: false,
        }));

        return feeInSol;
      } catch (error: any) {
        console.error('Fee estimation error:', error);
        setState(prev => ({
          ...prev,
          estimatedFee: 0.000005,
          status: 'idle',
          loading: false,
        }));
        return 0.000005;
      }
    },
    [connection]
  );

  const checkBalance = useCallback(
    async (requiredAmount: number, includeFee: boolean = true): Promise<boolean> => {
      if (!publicKey) {
        return false;
      }

      try {
        const balanceLamports = await connection.getBalance(publicKey);
        const balanceSol = lamportsToSol(balanceLamports);
        const feeEstimate = state.estimatedFee || 0.000005;
        const totalRequired = includeFee ? requiredAmount + feeEstimate : requiredAmount;

        return balanceSol >= totalRequired;
      } catch (error: any) {
        console.error('Balance check error:', error);

        const errorMsg = error?.message || error?.toString() || '';
        if (errorMsg.includes('freetier') || errorMsg.includes('not available')) {
          console.warn('Balance check skipped due to RPC limitation. Transaction will be attempted.');
          return true;
        }

        return false;
      }
    },
    [publicKey, connection, state.estimatedFee]
  );

  const sendSolTransaction = useCallback(
    async (
      transaction: Transaction,
      onSuccess?: (signature: string) => void | Promise<void>,
      onError?: (error: Error) => void,
      maxRetries: number = 0
    ): Promise<string | null> => {
      if (!publicKey) {
        const error = new Error('Wallet not connected');
        setState(prev => ({ ...prev, error: error.message, status: 'failed' }));
        toast.error('Wallet not connected. Please connect your wallet and try again.');
        onError?.(error);
        return null;
      }

      if (!sendTransaction) {
        const error = new Error('Wallet sendTransaction function not available');
        setState(prev => ({ ...prev, error: error.message, status: 'failed' }));
        toast.error('Wallet is not ready. Please reconnect your wallet.');
        onError?.(error);
        return null;
      }

      const attemptTransaction = async (attemptNumber: number): Promise<string | null> => {
        setState({
          loading: true,
          error: null,
          signature: null,
          confirmed: false,
          status: 'pending',
          estimatedFee: state.estimatedFee,
        });

        try {
          const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
          transaction.recentBlockhash = blockhash;
          transaction.lastValidBlockHeight = lastValidBlockHeight;
          transaction.feePayer = publicKey;

          if (attemptNumber === 0) {
            toast.info('Please approve the transaction in your wallet...');
          } else {
            toast.info(`Retry attempt ${attemptNumber}/${maxRetries}...`);
          }

          const signature = await sendTransaction(transaction, connection);

          setState(prev => ({
            ...prev,
            signature,
            loading: true,
            status: 'confirming',
          }));

          toast.info('Transaction sent! Waiting for confirmation...');

          const isConfirmed = await confirmTransaction(connection, signature, 'confirmed', 30);

          if (isConfirmed) {
            setState({
              loading: false,
              error: null,
              signature,
              confirmed: true,
              status: 'confirmed',
              estimatedFee: state.estimatedFee,
            });

            if (onSuccess) {
              await Promise.resolve(onSuccess(signature));
            }

            return signature;
          } else {
            throw new Error('Transaction confirmation timeout');
          }
        } catch (error: any) {
          const errorMsg = error?.message?.toLowerCase() || '';
          const isUserRejection = errorMsg.includes('user rejected') ||
                                  errorMsg.includes('user denied') ||
                                  errorMsg.includes('user cancelled');

          if (isUserRejection) {
            throw error;
          }

          if (attemptNumber < maxRetries) {
            toast.warning(`Transaction failed. Retrying... (${attemptNumber + 1}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attemptNumber)));
            return attemptTransaction(attemptNumber + 1);
          }

          throw error;
        }
      };

      try {
        return await attemptTransaction(0);
      } catch (error: any) {
        console.error('Transaction error details:', {
          name: error?.name,
          message: error?.message,
          code: error?.code,
          innerError: error?.error,
          cause: error?.cause,
          logs: error?.logs,
          stack: error?.stack,
          fullError: error,
        });

        if (error?.error) {
          console.error('Inner error:', error.error);
        }

        if (error?.cause) {
          console.error('Error cause:', error.cause);
        }

        const parsedError = parseTransactionError(error);
        const severity = getErrorSeverity(error);

        setState({
          loading: false,
          error: parsedError,
          signature: null,
          confirmed: false,
          status: 'failed',
          estimatedFee: state.estimatedFee,
        });

        if (severity === 'warning') {
          toast.warning(parsedError);
        } else {
          toast.error(parsedError);
        }

        onError?.(error);
        return null;
      }
    },
    [publicKey, sendTransaction, connection, state.estimatedFee]
  );

  const reset = useCallback(() => {
    setState({
      loading: false,
      error: null,
      signature: null,
      confirmed: false,
      status: 'idle',
      estimatedFee: null,
    });
  }, []);

  return {
    ...state,
    sendSolTransaction,
    estimateFee,
    checkBalance,
    reset,
    isWalletConnected: !!publicKey,
    walletPublicKey: publicKey,
  };
}

export function useSolBalance() {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchBalance = useCallback(async () => {
    if (!publicKey) {
      setBalance(null);
      return;
    }

    setLoading(true);
    try {
      const lamports = await connection.getBalance(publicKey);
      const sol = lamports / 1e9;
      setBalance(sol);
    } catch (error: any) {
      console.error('Error fetching balance:', error);

      const errorMsg = error?.message || error?.toString() || '';
      if (errorMsg.includes('freetier') || errorMsg.includes('not available')) {
        console.warn('Balance check skipped: Free RPC tier limitation. Balance will be checked during transaction.');
        setBalance(null);
      } else {
        toast.error('Failed to fetch wallet balance');
        setBalance(null);
      }
    } finally {
      setLoading(false);
    }
  }, [publicKey, connection]);

  return {
    balance,
    loading,
    fetchBalance,
    refreshBalance: fetchBalance,
  };
}
