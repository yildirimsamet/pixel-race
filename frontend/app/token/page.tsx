'use client';

import { useEffect, useState, useCallback } from 'react';
import { FiRefreshCw } from 'react-icons/fi';
import { GiTwoCoins } from 'react-icons/gi';
import { BsCurrencyBitcoin } from 'react-icons/bs';
import TokenInfoCard from '@/components/TokenInfoCard';
import Loader from '@/components/Loader';
import { CiCoins1 } from 'react-icons/ci';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface TokenInfo {
  token_name: string;
  contract_address: string;
  token_url: string;
  description?: string;
  updated_at: string;
}

export default function TokenPage() {
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchTokenInfo = useCallback(async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      const response = await fetch(`${API_URL}/token/info`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch token information');
      }

      const data = await response.json();
      setTokenInfo(data);
    } catch (err) {
      console.error('Error fetching token info:', err);
      setError(err instanceof Error ? err.message : 'Failed to load token information');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchTokenInfo();
  }, [fetchTokenInfo]);

  const handleRefresh = () => {
    fetchTokenInfo(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <Loader text="Loading token information..." size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <div className="text-6xl">⚠️</div>
        <h2 className="text-2xl font-bold text-red-400">Error Loading Token Info</h2>
        <p className="text-gray-400">{error}</p>
        <button
          onClick={handleRefresh}
          className="btn-neon px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!tokenInfo) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <div className="text-6xl">📝</div>
        <h2 className="text-2xl font-bold text-gray-400">Token Information Not Available</h2>
        <p className="text-gray-500">Token details have not been configured yet.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8 animate-fade-in">
      <div className="relative overflow-hidden rounded-2xl p-12 mb-12">
        <div
          className="absolute inset-0 bg-gradient-to-br from-purple-900/40 via-pink-900/40 to-cyan-900/40"
          style={{
            backgroundSize: '400% 400%',
            animation: 'gradientShift 15s ease infinite',
          }}
        />

        <div
          className="absolute inset-0"
          style={{
            boxShadow: 'inset 0 0 100px rgba(147, 51, 234, 0.3)',
          }}
        />

        <div className="relative z-10 text-center space-y-6">
          <div className="flex justify-center">
            <div className="text-7xl token-icon-glow">
              <GiTwoCoins />
            </div>
          </div>

          <h1
            className="text-6xl font-black"
            style={{
              background: 'linear-gradient(135deg, #00d9ff 0%, #b537ff 50%, #ff2e97 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              textShadow: '0 0 80px rgba(0, 217, 255, 0.5)',
              filter: 'drop-shadow(0 0 20px rgba(181, 55, 255, 0.8))',
            }}
          >
            {tokenInfo.token_name}
          </h1>

          {tokenInfo.description && (
            <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
              {tokenInfo.description}
            </p>
          )}
        </div>

        <div className="absolute top-10 left-10 w-32 h-32 bg-cyan-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
        <TokenInfoCard
          title="Contract Address"
          value={tokenInfo.contract_address}
          type="address"
          icon={<CiCoins1 className="text-cyan-400" />}
          description="Solana blockchain contract address"
        />

        <TokenInfoCard
          title="Token Page"
          value={tokenInfo.token_url}
          type="url"
          icon={<GiTwoCoins className="text-purple-400" />}
          description="Official token page on Pump.fun"
        />
      </div>

      <div className="max-w-5xl mx-auto mt-12 glass-dark rounded-xl p-8 border border-purple-500/20">
        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
          <span className="text-3xl">ℹ️</span>
          About {tokenInfo.token_name}
        </h2>
        <div className="space-y-4 text-gray-300">
          <p>
            {tokenInfo.token_name} is the official token of Pixel Race, powering the racing ecosystem
            and providing utility for players within the game.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-black/40 rounded-lg p-4 border border-cyan-500/20">
              <div className="text-2xl mb-2">🎮</div>
              <h3 className="font-semibold text-white mb-1">Gaming Utility</h3>
              <p className="text-sm text-gray-400">Use tokens in races and competitions</p>
            </div>
            <div className="bg-black/40 rounded-lg p-4 border border-purple-500/20">
              <div className="text-2xl mb-2">🏆</div>
              <h3 className="font-semibold text-white mb-1">Rewards</h3>
              <p className="text-sm text-gray-400">Earn rewards from winning races</p>
            </div>
            <div className="bg-black/40 rounded-lg p-4 border border-pink-500/20">
              <div className="text-2xl mb-2">🔥</div>
              <h3 className="font-semibold text-white mb-1">Community</h3>
              <p className="text-sm text-gray-400">Join our growing racing community</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
