import { FaExclamationTriangle, FaExternalLinkAlt } from 'react-icons/fa';
import { formatSOLWithSymbol } from '@/lib/solana-fees';

interface BalanceWarningProps {
  currentBalance: number;
  requiredAmount: number;
  estimatedFee: number;
  network?: string;
}

export default function BalanceWarning({
  currentBalance,
  requiredAmount,
  estimatedFee,
  network = 'devnet'
}: BalanceWarningProps) {
  const totalRequired = requiredAmount + estimatedFee;
  const missingAmount = totalRequired - currentBalance;
  const isInsufficient = missingAmount > 0;

  if (!isInsufficient) {
    return null;
  }

  return (
    <div className="glass rounded-xl p-4 border border-neon-orange/50 bg-neon-orange/5 animate-fade-in">
      <div className="flex items-start gap-3">
        <FaExclamationTriangle className="text-neon-orange text-2xl flex-shrink-0 mt-1 animate-pulse" />
        <div className="flex-1">
          <h4 className="text-neon-orange font-bold text-lg mb-2">Insufficient Balance</h4>
          <div className="space-y-2 text-sm text-gray-300">
            <div className="flex justify-between">
              <span className="text-gray-400">Current Balance:</span>
              <span className="font-mono">{formatSOLWithSymbol(currentBalance)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Transaction Amount:</span>
              <span className="font-mono">{formatSOLWithSymbol(requiredAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Est. Network Fee:</span>
              <span className="font-mono text-xs">~{formatSOLWithSymbol(estimatedFee)}</span>
            </div>
            <div className="h-px bg-gradient-to-r from-transparent via-neon-orange/30 to-transparent my-2"></div>
            <div className="flex justify-between text-base">
              <span className="font-semibold text-white">Total Required:</span>
              <span className="font-mono font-bold text-neon-orange">{formatSOLWithSymbol(totalRequired)}</span>
            </div>
            <div className="flex justify-between text-base">
              <span className="font-semibold text-white">Missing:</span>
              <span className="font-mono font-bold text-red-400">{formatSOLWithSymbol(missingAmount)}</span>
            </div>
          </div>

          {network === 'devnet' && (
            <a
              href="https://faucet.solana.com"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 flex items-center justify-center gap-2 bg-gradient-to-r from-neon-purple to-purple-600 hover:from-neon-purple hover:to-neon-pink text-white font-bold py-2.5 px-4 rounded-lg transition-all duration-300 hover:scale-105"
            >
              <span>Get Devnet SOL</span>
              <FaExternalLinkAlt className="text-sm" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
