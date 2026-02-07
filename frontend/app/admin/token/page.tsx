'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { FiSave, FiRefreshCw, FiExternalLink } from 'react-icons/fi';
import { toast } from 'react-toastify';
import Loader from '@/components/Loader';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface TokenInfo {
  token_name: string;
  contract_address: string;
  token_url: string;
  description?: string;
  updated_at: string;
}

export default function AdminTokenPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    token_name: '',
    contract_address: '',
    token_url: '',
    description: '',
  });

  useEffect(() => {
    if (!authLoading && !user?.is_admin) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  const fetchTokenInfo = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_URL}/admin/token-info`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setTokenInfo(data);
        setFormData({
          token_name: data.token_name || '',
          contract_address: data.contract_address || '',
          token_url: data.token_url || '',
          description: data.description || '',
        });
      } else if (response.status === 404) {
        toast.info('Token information not configured yet. Please fill in the details.');
      } else {
        throw new Error('Failed to fetch token info');
      }
    } catch (error) {
      console.error('Error fetching token info:', error);
      toast.error('Failed to load token information');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.is_admin) {
      fetchTokenInfo();
    }
  }, [user?.is_admin, fetchTokenInfo]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.token_name.trim()) {
      toast.error('Token name is required');
      return;
    }
    if (!formData.contract_address.trim()) {
      toast.error('Contract address is required');
      return;
    }
    if (!formData.token_url.trim()) {
      toast.error('Token URL is required');
      return;
    }

    try {
      setIsSaving(true);
      const response = await fetch(`${API_URL}/admin/token-info`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to update token info');
      }

      const updatedData = await response.json();
      setTokenInfo(updatedData);
      toast.success('Token information updated successfully!');
    } catch (error) {
      console.error('Error updating token info:', error);
      toast.error('Failed to update token information');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePreview = () => {
    window.open('/token', '_blank');
  };

  if (authLoading || !user?.is_admin) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader text="Loading token information..." size="lg" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Token Information</h1>
          <p className="text-gray-400">Manage Pixel Race token details displayed on the token page</p>
        </div>
        <button
          onClick={handlePreview}
          className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors"
        >
          <FiExternalLink />
          Preview Page
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="glass-dark rounded-xl p-8 border border-purple-500/30 space-y-6">
          <div>
            <label htmlFor="token_name" className="block text-white font-semibold mb-2">
              Token Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="token_name"
              name="token_name"
              value={formData.token_name}
              onChange={handleInputChange}
              placeholder="e.g., Pixel Race Token"
              required
              className="w-full px-4 py-3 bg-black/40 border border-purple-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <p className="text-sm text-gray-400 mt-1">
              The official name of your token
            </p>
          </div>

          <div>
            <label htmlFor="contract_address" className="block text-white font-semibold mb-2">
              Contract Address <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="contract_address"
              name="contract_address"
              value={formData.contract_address}
              onChange={handleInputChange}
              placeholder="e.g., 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU"
              required
              className="w-full px-4 py-3 bg-black/40 border border-purple-500/30 rounded-lg text-white font-mono placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <p className="text-sm text-gray-400 mt-1">
              Solana blockchain contract address
            </p>
          </div>

          <div>
            <label htmlFor="token_url" className="block text-white font-semibold mb-2">
              Token URL <span className="text-red-500">*</span>
            </label>
            <input
              type="url"
              id="token_url"
              name="token_url"
              value={formData.token_url}
              onChange={handleInputChange}
              placeholder="e.g., https://pump.fun/coin/7xKXtg2CW..."
              required
              className="w-full px-4 py-3 bg-black/40 border border-purple-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <p className="text-sm text-gray-400 mt-1">
              Link to token page on Pump.fun or other platform
            </p>
          </div>

          <div>
            <label htmlFor="description" className="block text-white font-semibold mb-2">
              Description (Optional)
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Brief description of your token..."
              rows={4}
              className="w-full px-4 py-3 bg-black/40 border border-purple-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
            />
            <p className="text-sm text-gray-400 mt-1">
              Optional marketing text displayed on the token page (max 1000 characters)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={isSaving}
            className="flex-1 btn-neon flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              boxShadow: '0 0 30px rgba(147, 51, 234, 0.5)',
            }}
          >
            {isSaving ? (
              <>
                <FiRefreshCw className="animate-spin text-xl" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <FiSave className="text-xl" />
                <span>Save Changes</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={fetchTokenInfo}
            disabled={isSaving}
            className="px-6 py-4 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition-colors disabled:opacity-50"
          >
            Reset
          </button>
        </div>
      </form>

      {tokenInfo && (
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Last updated: {new Date(tokenInfo.updated_at).toLocaleString()}
          </p>
        </div>
      )}

      <div className="mt-8 bg-cyan-900/20 border border-cyan-500/30 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-cyan-400 mb-2 flex items-center gap-2">
          <span>ℹ️</span>
          How it works
        </h3>
        <ul className="text-sm text-gray-300 space-y-2">
          <li>• Changes made here will be instantly visible on the <strong>/token</strong> page</li>
          <li>• Users can copy the contract address and visit the token page directly</li>
          <li>• The token page updates automatically when you save changes</li>
          <li>• All fields except description are required</li>
        </ul>
      </div>
    </div>
  );
}
