'use client';

import { useState } from 'react';
import { FiCopy, FiCheck, FiExternalLink } from 'react-icons/fi';

interface TokenInfoCardProps {
  title: string;
  value: string;
  type: 'address' | 'url';
  icon?: React.ReactNode;
  description?: string;
}

export default function TokenInfoCard({
  title,
  value,
  type,
  icon,
  description
}: TokenInfoCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleVisit = () => {
    window.open(value, '_blank', 'noopener,noreferrer');
  };

  const truncateAddress = (address: string) => {
    if (address.length <= 20) return address;
    return `${address.slice(0, 8)}...${address.slice(-8)}`;
  };

  return (
    <div
      className="glass-dark rounded-xl p-6 space-y-4 card-hover group relative overflow-hidden"
      style={{
        border: '1px solid rgba(147, 51, 234, 0.3)',
        boxShadow: '0 0 30px rgba(147, 51, 234, 0.2)',
      }}
    >
      <div
        className="absolute inset-0 bg-gradient-to-br from-purple-600/0 to-pink-600/0 group-hover:from-purple-600/10 group-hover:to-pink-600/10 transition-all duration-500 pointer-events-none"
      />

      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-4">
          {icon && (
            <div className="text-3xl" style={{
              filter: 'drop-shadow(0 0 8px rgba(147, 51, 234, 0.6))'
            }}>
              {icon}
            </div>
          )}
          <h3 className="text-xl font-bold text-white">{title}</h3>
        </div>

        {description && (
          <p className="text-sm text-gray-400 mb-4">{description}</p>
        )}

        <div className="bg-black/40 rounded-lg p-4 mb-4 border border-purple-500/20">
          <code className="text-cyan-400 font-mono text-sm break-all block">
            {value}
          </code>
        </div>

        {type === 'address' ? (
          <button
            onClick={handleCopy}
            className="w-full btn-neon flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600/20 to-pink-600/20 hover:from-purple-600/30 hover:to-pink-600/30 rounded-lg font-semibold text-white transition-all duration-300 border border-purple-500/40"
            style={{
              boxShadow: '0 0 20px rgba(147, 51, 234, 0.3)',
            }}
          >
            {copied ? (
              <>
                <FiCheck className="text-xl text-green-400" />
                <span className="text-green-400">Copied!</span>
              </>
            ) : (
              <>
                <FiCopy className="text-xl" />
                <span>Copy Address</span>
              </>
            )}
          </button>
        ) : (
          <button
            onClick={handleVisit}
            className="w-full btn-neon flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-cyan-600/20 to-blue-600/20 hover:from-cyan-600/30 hover:to-blue-600/30 rounded-lg font-semibold text-white transition-all duration-300 border border-cyan-500/40"
            style={{
              boxShadow: '0 0 20px rgba(0, 217, 255, 0.3)',
            }}
          >
            <FiExternalLink className="text-xl" />
            <span>Visit Token Page</span>
          </button>
        )}
      </div>

      <div
        className="absolute -top-10 -right-10 w-40 h-40 bg-purple-600/20 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
      />
    </div>
  );
}
