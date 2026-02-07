'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { FaWallet, FaSignOutAlt } from 'react-icons/fa';
import { api, ApiError } from '@/lib/api';
import { toast } from '@/lib/toast';
import { useAuth } from '@/hooks/useAuth';

type ConnectionState = 'idle' | 'connecting' | 'verifying' | 'success' | 'error';

interface WalletLoginState {
  hasAttemptedLogin: boolean;
  lastWalletAddress: string | null;
  manualDisconnect: boolean;
  isSigningInProgress: boolean;
}

interface WalletConnectButtonProps {
  compact?: boolean;
  onSigningStateChange?: (isSigning: boolean) => void;
}

export default function WalletConnectButton({ compact = false, onSigningStateChange }: WalletConnectButtonProps) {
  const { publicKey, signMessage, connected, disconnect, connecting, wallet } = useWallet();
  const { setVisible: setModalVisible } = useWalletModal();
  const [connectionState, setConnectionState] = useState<ConnectionState>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { logout } = useAuth();

  const loginState = useRef<WalletLoginState>({
    hasAttemptedLogin: false,
    lastWalletAddress: null,
    manualDisconnect: false,
    isSigningInProgress: false,
  });

  const signMessageRef = useRef(signMessage);

  useEffect(() => {
    signMessageRef.current = signMessage;
  }, [signMessage]);

  const resetLoginState = useCallback((keepManualDisconnect = false) => {
    loginState.current = {
      hasAttemptedLogin: false,
      lastWalletAddress: null,
      manualDisconnect: keepManualDisconnect ? loginState.current.manualDisconnect : false,
      isSigningInProgress: false,
    };

    if (!keepManualDisconnect) {
      logout();
    }
  }, [logout]);

  useEffect(() => {
    if (!connected) {
      if (loginState.current.lastWalletAddress) {
        loginState.current.manualDisconnect = true;
        logout();
      }

      resetLoginState(true);
      setConnectionState('idle');
      setErrorMessage(null);
      return;
    }

    loginState.current.manualDisconnect = false;

    const currentAddress = publicKey?.toBase58() || null;
    if (
      loginState.current.lastWalletAddress &&
      loginState.current.lastWalletAddress !== currentAddress
    ) {
      resetLoginState();
      loginState.current.lastWalletAddress = currentAddress;
    }
  }, [connected, publicKey, resetLoginState, logout]);

  const verifyExistingSession = useCallback(
    async (currentAddress: string): Promise<boolean> => {
      try {
        const user = await api.users.getMe();
        if (user.wallet_address === currentAddress) {
          loginState.current.hasAttemptedLogin = true;
          loginState.current.lastWalletAddress = currentAddress;
          return true;
        }
        logout();
        return false;
      } catch {
        logout();
        return false;
      }
    },
    [logout]
  );

  const performWalletLogin = useCallback(async () => {
    if (!publicKey || !signMessageRef.current) {
      throw new Error('Wallet not ready');
    }

    loginState.current.isSigningInProgress = true;
    onSigningStateChange?.(true);
    setConnectionState('connecting');

    const timestamp = Date.now();
    const message = `Sign in to Pixel Race: ${timestamp}`;
    const encodedMessage = new TextEncoder().encode(message);

    const signaturePromise = signMessageRef.current(encodedMessage);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Signature request timed out')), 60000)
    );

    const signature = await Promise.race([signaturePromise, timeoutPromise]) as Uint8Array;

    setConnectionState('verifying');

    await api.auth.walletLogin({
      wallet_address: publicKey.toBase58(),
      signature: Buffer.from(signature).toString('base64'),
      message,
    });

    loginState.current.hasAttemptedLogin = true;
    loginState.current.lastWalletAddress = publicKey.toBase58();
    loginState.current.isSigningInProgress = false;
    onSigningStateChange?.(false);

    setConnectionState('success');
    toast.success('Wallet connected successfully!');

    window.dispatchEvent(new CustomEvent('auth:login'));
  }, [publicKey, onSigningStateChange]);

  useEffect(() => {
    if (
      !connected ||
      !publicKey ||
      !signMessageRef.current ||
      connectionState !== 'idle' ||
      loginState.current.hasAttemptedLogin ||
      loginState.current.manualDisconnect ||
      loginState.current.isSigningInProgress
    ) {
      return;
    }

    const currentAddress = publicKey.toBase58();

    if (loginState.current.lastWalletAddress === currentAddress) {
      return;
    }

    loginState.current.lastWalletAddress = currentAddress;

    let isMounted = true;

    const attemptLogin = async () => {
      const isSessionValid = await verifyExistingSession(currentAddress);

      if (!isMounted) return;

      if (isSessionValid) {
        setConnectionState('success');
        window.dispatchEvent(new CustomEvent('auth:login'));
        return;
      }

      try {
        await performWalletLogin();
      } catch (error) {

        const errorMsg =
          error instanceof ApiError
            ? error.message
            : error instanceof Error
            ? error.message
            : 'Wallet login failed. Please try again.';

        const isUserRejection =
          errorMsg.includes('User rejected') ||
          errorMsg.includes('rejected') ||
          errorMsg.includes('cancelled') ||
          errorMsg.includes('denied');

        if (isUserRejection) {
          loginState.current.hasAttemptedLogin = false;
          loginState.current.lastWalletAddress = null;
          loginState.current.isSigningInProgress = false;
          loginState.current.manualDisconnect = true;
          onSigningStateChange?.(false);
          setConnectionState('idle');
          setErrorMessage(null);

          if (!isMounted) return;
          toast.warning('Signature request cancelled. Please try again.');

          disconnect();
        } else {
          loginState.current.hasAttemptedLogin = false;
          loginState.current.lastWalletAddress = null;
          loginState.current.isSigningInProgress = false;
          onSigningStateChange?.(false);
          setConnectionState('error');

          if (!isMounted) return;
          setErrorMessage(errorMsg);
          toast.error(errorMsg);

          setTimeout(() => {
            if (!isMounted) return;
            setConnectionState('idle');
            setErrorMessage(null);
          }, 5000);
        }
      }
    };

    attemptLogin();

    return () => {
      isMounted = false;
    };
  }, [connected, publicKey, connectionState, verifyExistingSession, performWalletLogin, disconnect, wallet]);

  const getStatusMessage = (): string | null => {
    switch (connectionState) {
      case 'connecting':
        return 'Signing message...';
      case 'verifying':
        return 'Verifying...';
      case 'success':
        return 'Success!';
      case 'error':
        return errorMessage;
      default:
        return null;
    }
  };

  const statusMessage = getStatusMessage();

  const showAsConnected = connected && connectionState === 'success';

  const handleOpenWalletModal = async () => {
    if (connected && loginState.current.manualDisconnect) {
      try {
        await disconnect();
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
      }
    }
    setModalVisible(true);
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
      logout();
      toast.info('Wallet disconnected');
    } catch (error) {
      toast.error('Failed to disconnect');
    }
  };

  return (
    <div className="relative">
      {!showAsConnected ? (
        <button
          onClick={handleOpenWalletModal}
          className={`relative flex items-center gap-2.5 ${compact ? 'px-3 py-2' : 'px-4 py-2'} rounded-lg bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/40 shadow-neon-purple transition-all duration-300 hover:shadow-[0_0_25px_rgba(181,55,255,0.7)] hover:scale-105 ${compact ? 'justify-center' : ''}`}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-pink-600/10 rounded-lg animate-pulse-slow"></div>
          <FaWallet className={`text-purple-400 ${compact ? 'text-base' : 'text-lg'} z-10`} />
          {!compact && (
            <span className="text-purple-300 font-bold text-sm z-10">
              Connect Wallet
            </span>
          )}
        </button>
      ) : (
        <div className={`relative flex items-center gap-2 ${compact ? 'px-3 py-2' : 'px-4 py-2.5'} rounded-lg bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/40 shadow-neon-purple transition-all duration-300`}>
          <FaWallet className="text-purple-400 text-sm z-10" />
          {!compact && publicKey && (
            <span className="text-purple-300 font-mono text-xs z-10">
              {publicKey.toBase58().slice(0, 4)}...{publicKey.toBase58().slice(-4)}
            </span>
          )}
          <button
            onClick={handleDisconnect}
            className="ml-auto text-red-400 hover:text-red-300 transition-colors z-10"
            title="Disconnect"
          >
            <FaSignOutAlt className="text-sm" />
          </button>
        </div>
      )}
      {statusMessage && (connectionState === 'error' || connectionState === 'connecting' || connectionState === 'verifying') && (
        <div className="absolute -bottom-8 left-0 right-0 text-center">
          <span className={`text-xs ${connectionState === 'error' ? 'animate-pulse text-red-400' : 'text-purple-400'}`}>
            {statusMessage}
          </span>
        </div>
      )}
    </div>
  );
}
