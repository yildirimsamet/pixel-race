'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { FaWallet } from 'react-icons/fa';

interface LoginPromptProps {
  title?: string;
  message?: string;
  className?: string;
  buttonText?: string;
  icon?: React.ReactNode;
}

export default function LoginPrompt({
  title = 'Connect Your Wallet',
  message = 'Please connect your Solana wallet to continue',
  className = '',
  buttonText = 'Connect Wallet',
  icon
}: LoginPromptProps) {
  const { connected } = useWallet();
  const { setVisible } = useWalletModal();

  if (connected) {
    return null;
  }

  return (
    <div className={`glass rounded-3xl p-8 border border-neon-blue/30 shadow-neon text-center ${className}`}>
      <div className="mb-6">
        {icon || <FaWallet className="text-6xl text-neon-blue mx-auto mb-4" />}
        <h3 className="text-2xl font-bold text-white mb-2">{title}</h3>
        <p className="text-gray-400">{message}</p>
      </div>
      <button
        onClick={() => setVisible(true)}
        className="bg-gradient-to-r from-neon-blue to-blue-600 hover:from-neon-blue hover:to-neon-purple px-8 py-3 rounded-xl font-bold transition-all duration-300 shadow-neon hover:shadow-neon-lg hover:scale-105 inline-flex items-center gap-3"
      >
        <FaWallet className="text-xl" />
        <span>{buttonText}</span>
      </button>
    </div>
  );
}
