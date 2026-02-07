
import { useState, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { createHorsePurchaseTransaction, HORSE_PRICES } from '@/lib/solana-transactions';
import { useTransaction, useSolBalance } from './useTransaction';
import { horses as horsesApi } from '@/lib/api';
import { TOAST_MESSAGES } from '@/lib/toast-messages';
import {
  validateWallet,
  validateHorseLevel,
  validateBalance,
  validateTreasuryWallet
} from '@/lib/validators';
import type { HorseBuyResponse } from '@/types';

interface UseHorsePurchaseReturn {
  purchaseHorse: (level: number) => Promise<HorseBuyResponse>;
  isLoading: boolean;
  selectedLevel: number | null;
  showBalanceWarning: boolean;
  setShowBalanceWarning: (show: boolean) => void;
}

export const useHorsePurchase = (): UseHorsePurchaseReturn => {
  const { connected, publicKey } = useWallet();
  const { sendSolTransaction, estimateFee } = useTransaction();
  const { balance: solBalance, fetchBalance } = useSolBalance();

  const [isLoading, setIsLoading] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
  const [showBalanceWarning, setShowBalanceWarning] = useState(false);

  const purchaseHorse = useCallback(
    async (level: number): Promise<HorseBuyResponse> => {
      if (!validateWallet(connected, publicKey)) {
        throw new Error('Wallet not connected');
      }

      if (!validateHorseLevel(level)) {
        throw new Error('Invalid level');
      }

      const priceInSol = HORSE_PRICES[level];
      const treasuryAddress = process.env.NEXT_PUBLIC_TREASURY_WALLET;

      if (!validateTreasuryWallet(treasuryAddress)) {
        throw new Error('Treasury not configured');
      }

      setSelectedLevel(level);
      setShowBalanceWarning(false);
      setIsLoading(true);

      try {
        const validation = await horsesApi.canBuyBox(level);

        if (!validation.can_buy) {
          const errorMessage =
            validation.error ||
            validation.message ||
            'Cannot purchase horse at this time';
          TOAST_MESSAGES.ERROR(errorMessage);
          throw new Error(errorMessage);
        }

        const transaction = await createHorsePurchaseTransaction(
          publicKey!,
          treasuryAddress!,
          priceInSol
        );

        const feeEstimate = await estimateFee(transaction);

        if (solBalance !== null) {
          const isValid = validateBalance(solBalance, priceInSol, feeEstimate);
          if (!isValid) {
            setShowBalanceWarning(true);
            throw new Error('Insufficient balance');
          }
        }

        TOAST_MESSAGES.PAYMENT_PROCESSING(priceInSol);

        let mintedHorse: HorseBuyResponse | null = null;

        await sendSolTransaction(
          transaction,
          async (signature) => {
            TOAST_MESSAGES.PAYMENT_CONFIRMED();
            TOAST_MESSAGES.HORSE_MINTING();

            const response = await horsesApi.buyBox({
              max_level: level,
              transaction_signature: signature,
            });

            const stats = await horsesApi.getStats(response.horse.id);

            mintedHorse = {
              ...response,
              horse: {
                ...response.horse,
                stats: {
                  ...stats.base_stats,
                  ...stats.dynamic_stats,
                  ...stats.performance,
                },
              },
            };

            TOAST_MESSAGES.HORSE_MINTED_SUCCESS(response.horse.name);

            fetchBalance();
            setSelectedLevel(null);
            setShowBalanceWarning(false);
          },
          (error) => {
            console.error('Transaction failed:', error);
            TOAST_MESSAGES.HORSE_PURCHASE_FAILED(error.message);
            throw error;
          }
        );

        if (!mintedHorse) {
          throw new Error('Transaction not completed');
        }

        return mintedHorse;
      } catch (error: any) {
        console.error('Horse purchase error:', error);
        TOAST_MESSAGES.HORSE_PURCHASE_FAILED(error.message);
        throw error;
      } finally {
        setIsLoading(false);
        setSelectedLevel(null);
      }
    },
    [connected, publicKey, sendSolTransaction, estimateFee, solBalance, fetchBalance]
  );

  return {
    purchaseHorse,
    isLoading,
    selectedLevel,
    showBalanceWarning,
    setShowBalanceWarning,
  };
};
