
import { PublicKey } from '@solana/web3.js';
import { TOAST_MESSAGES } from './toast-messages';

export const validateWallet = (
  connected: boolean,
  publicKey: PublicKey | null
): boolean => {
  if (!connected || !publicKey) {
    TOAST_MESSAGES.WALLET_NOT_CONNECTED();
    return false;
  }
  return true;
};

export const validateHorseLevel = (level: number): boolean => {
  if (![1, 2, 3].includes(level)) {
    TOAST_MESSAGES.INVALID_HORSE_LEVEL();
    return false;
  }
  return true;
};

export const validateBalance = (
  currentBalance: number,
  requiredAmount: number,
  estimatedFee: number
): boolean => {
  const totalRequired = requiredAmount + estimatedFee;

  if (currentBalance < totalRequired) {
    TOAST_MESSAGES.INSUFFICIENT_BALANCE(requiredAmount, currentBalance, estimatedFee);
    return false;
  }

  return true;
};

export const validateTreasuryWallet = (
  treasuryAddress: string | undefined
): boolean => {
  if (!treasuryAddress) {
    TOAST_MESSAGES.TREASURY_NOT_CONFIGURED();
    return false;
  }
  return true;
};

export interface RaceJoinValidation {
  canJoin: boolean;
  reason?: string;
}

export const validateRaceJoin = (
  raceStatus: string,
  horseInRace: boolean,
  isFull: boolean
): RaceJoinValidation => {
  if (raceStatus === 'racing' || raceStatus === 'done') {
    TOAST_MESSAGES.RACE_ALREADY_STARTED();
    return { canJoin: false, reason: 'Race already started' };
  }

  if (horseInRace) {
    TOAST_MESSAGES.HORSE_ALREADY_RACING();
    return { canJoin: false, reason: 'Horse already in race' };
  }

  if (isFull) {
    TOAST_MESSAGES.RACE_FULL();
    return { canJoin: false, reason: 'Race is full' };
  }

  return { canJoin: true };
};

export const validate = <T>(
  value: T,
  validator: (val: T) => boolean,
  errorMessage: string
): boolean => {
  if (!validator(value)) {
    TOAST_MESSAGES.ERROR(errorMessage);
    return false;
  }
  return true;
};
