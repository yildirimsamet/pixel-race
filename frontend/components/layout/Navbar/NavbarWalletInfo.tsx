'use client';

import { useState, useRef, useEffect } from 'react';
import { FaWallet } from 'react-icons/fa';
import { IoLogOut } from 'react-icons/io5';
import { FiChevronDown } from 'react-icons/fi';

interface NavbarWalletInfoProps {
  balance: number;
  variant?: 'desktop' | 'mobile';
  onDisconnect?: () => void;
  walletAddress?: string;
}

export function NavbarWalletInfo({
  balance,
  variant = 'desktop',
  onDisconnect,
  walletAddress
}: NavbarWalletInfoProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const truncatedAddress = walletAddress
    ? `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`
    : '';

  if (variant === 'mobile') {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/40">
        <FaWallet className="text-purple-400 text-sm" />
        <span className="text-purple-300 font-bold text-xs">
          {balance.toFixed(2)}
        </span>
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex items-center gap-2.5 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/40 shadow-neon-purple transition-all duration-300 hover:shadow-[0_0_25px_rgba(181,55,255,0.7)] hover:scale-105"
        aria-label={`Wallet balance: ${balance.toFixed(4)} SOL`}
        aria-expanded={isOpen}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-pink-600/10 rounded-lg animate-pulse-slow"></div>
        <FaWallet className="text-purple-400 text-lg z-10" />
        <span className="text-purple-300 font-bold text-sm z-10">
          {balance.toFixed(4)} SOL
        </span>
        <FiChevronDown
          className={`text-purple-400 text-base z-10 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-64 bg-gray-900/95 backdrop-blur-lg border border-purple-500/30 rounded-lg shadow-xl shadow-purple-500/20 overflow-hidden animate-slide-down">
          <div className="p-4 border-b border-purple-500/20">
            <div className="text-xs text-gray-500 mb-1">Wallet Address</div>
            <div className="text-sm text-purple-300 font-mono">{truncatedAddress}</div>
          </div>

          <div className="py-2">
            <button
              onClick={() => {
                onDisconnect?.();
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-red-600/20 hover:text-red-400 transition-all duration-200"
            >
              <IoLogOut className="text-lg" />
              <span className="text-sm font-medium">Disconnect Wallet</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
