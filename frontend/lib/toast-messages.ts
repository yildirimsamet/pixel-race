
import { toast } from './toast';
import { formatSOLWithSymbol } from './solana-fees';

export const TOAST_CONFIG = {
  SHORT: 3000,
  MEDIUM: 5000,
  LONG: 8000,
  EXTRA_LONG: 10000,
} as const;

export const TOAST_MESSAGES = {
  WALLET_NOT_CONNECTED: () => {
    toast.warning('Please connect your wallet first');
  },

  WALLET_DISCONNECT_SUCCESS: () => {
    toast.success('Wallet disconnected successfully', { autoClose: TOAST_CONFIG.SHORT });
  },

  INSUFFICIENT_BALANCE: (required: number, current: number, fee: number) => {
    const total = required + fee;
    toast.error(
      `Insufficient balance! Need ${formatSOLWithSymbol(total)} (${formatSOLWithSymbol(required)} + ${formatSOLWithSymbol(fee)} fee), have ${formatSOLWithSymbol(current)}`,
      { autoClose: TOAST_CONFIG.LONG }
    );
  },

  BALANCE_CHECK_FAILED: () => {
    toast.error('Failed to check balance. Please try again.', { autoClose: TOAST_CONFIG.MEDIUM });
  },

  PAYMENT_PROCESSING: (amount: number) => {
    toast.info(`Processing payment of ${formatSOLWithSymbol(amount)}...`, { autoClose: TOAST_CONFIG.MEDIUM });
  },

  PAYMENT_CONFIRMED: () => {
    toast.info('Payment confirmed! Processing your request...', { autoClose: TOAST_CONFIG.MEDIUM });
  },

  HORSE_MINTING: () => {
    toast.info('Minting your NFT horse...', { autoClose: TOAST_CONFIG.EXTRA_LONG });
  },

  HORSE_MINTED_SUCCESS: (horseName: string) => {
    toast.success(`🐴 ${horseName} joined your stable!`, { autoClose: TOAST_CONFIG.EXTRA_LONG });
  },

  HORSE_PURCHASE_FAILED: (error?: string) => {
    toast.error(error || 'Failed to purchase horse. Please try again.', { autoClose: TOAST_CONFIG.LONG });
  },

  INVALID_HORSE_LEVEL: () => {
    toast.error('Invalid horse level selected', { autoClose: TOAST_CONFIG.MEDIUM });
  },

  RACE_JOIN_SUCCESS: (horseName: string) => {
    toast.success(`${horseName} joined the race!`, { autoClose: TOAST_CONFIG.MEDIUM });
  },

  RACE_JOIN_FAILED: (error?: string) => {
    toast.error(error || 'Failed to join race. Please try again.', { autoClose: TOAST_CONFIG.LONG });
  },

  RACE_ALREADY_JOINED: () => {
    toast.warning('You already have a horse in this race', { autoClose: TOAST_CONFIG.MEDIUM });
  },

  RACE_FULL: () => {
    toast.error('This race is full', { autoClose: TOAST_CONFIG.MEDIUM });
  },

  RACE_ALREADY_STARTED: () => {
    toast.warning('This race has already started', { autoClose: TOAST_CONFIG.MEDIUM });
  },

  HORSE_ALREADY_RACING: () => {
    toast.warning('This horse is already in another race', { autoClose: TOAST_CONFIG.MEDIUM });
  },

  TRANSACTION_SUBMITTED: () => {
    toast.info('Transaction submitted. Waiting for confirmation...', { autoClose: TOAST_CONFIG.MEDIUM });
  },

  TRANSACTION_CONFIRMED: () => {
    toast.success('Transaction confirmed!', { autoClose: TOAST_CONFIG.MEDIUM });
  },

  TRANSACTION_FAILED: (error?: string) => {
    toast.error(error || 'Transaction failed. Please try again.', { autoClose: TOAST_CONFIG.LONG });
  },

  TRANSACTION_CANCELLED: () => {
    toast.warning('Transaction cancelled', { autoClose: TOAST_CONFIG.SHORT });
  },

  LOADING_DATA_FAILED: (resource?: string) => {
    toast.error(`Failed to load ${resource || 'data'}. Please refresh the page.`, { autoClose: TOAST_CONFIG.LONG });
  },

  DATA_UPDATED: () => {
    toast.success('Data updated successfully', { autoClose: TOAST_CONFIG.SHORT });
  },

  TREASURY_NOT_CONFIGURED: () => {
    toast.error('Treasury wallet not configured. Please contact support.', { autoClose: TOAST_CONFIG.LONG });
  },

  SUCCESS: (message: string) => {
    toast.success(message, { autoClose: TOAST_CONFIG.MEDIUM });
  },

  ERROR: (message: string) => {
    toast.error(message, { autoClose: TOAST_CONFIG.LONG });
  },

  WARNING: (message: string) => {
    toast.warning(message, { autoClose: TOAST_CONFIG.MEDIUM });
  },

  INFO: (message: string) => {
    toast.info(message, { autoClose: TOAST_CONFIG.MEDIUM });
  },
} as const;

export type ToastMessageKey = keyof typeof TOAST_MESSAGES;
