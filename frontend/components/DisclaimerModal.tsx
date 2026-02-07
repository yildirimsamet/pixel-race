'use client';

import { useState, useEffect } from 'react';
import { FiAlertTriangle, FiCheckCircle } from 'react-icons/fi';

const DISCLAIMER_KEY = 'disclaimer_accepted';

interface DisclaimerModalProps {
  onAccept?: () => void;
}

export default function DisclaimerModal({ onAccept }: DisclaimerModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isAccepted, setIsAccepted] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const accepted = localStorage.getItem(DISCLAIMER_KEY);
    if (accepted !== 'true') {
      setIsOpen(true);
    }
  }, []);

  const handleAccept = () => {
    if (!isAccepted) return;

    localStorage.setItem(DISCLAIMER_KEY, 'true');
    setIsOpen(false);
    onAccept?.();
  };

  if (!isMounted || !isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative max-w-3xl w-full mx-4 bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 border border-purple-500/30 rounded-2xl shadow-2xl max-h-[90vh] overflow-hidden">
        <div className="bg-red-600/20 border-b border-red-500/30 px-6 py-4">
          <div className="flex items-center gap-3">
            <FiAlertTriangle className="text-red-400 text-3xl animate-pulse" />
            <h2 className="text-2xl font-bold text-white">LEGAL DISCLAIMER</h2>
          </div>
        </div>

        <div className="px-6 py-6 overflow-y-auto max-h-[60vh] text-gray-200 space-y-4">
          <p className="text-lg font-semibold text-yellow-400">
            Pixel Race is an experimental blockchain-based gaming project.
          </p>

          <div className="space-y-3">
            <h3 className="text-xl font-bold text-red-400">IMPORTANT NOTICES:</h3>
            <ul className="space-y-2 list-disc list-inside">
              <li>This is NOT an investment platform or financial service</li>
              <li>Participation is entirely voluntary and at your own risk</li>
              <li>You may lose all SOL/funds you commit to the platform</li>
              <li>No guarantees are made regarding winnings, NFT values, or platform availability</li>
              <li>This project is provided &quot;as-is&quot; for technological and educational purposes only</li>
              <li>We are not responsible for any losses, damages, or issues arising from your use</li>
              <li>You must comply with all applicable laws in your jurisdiction</li>
              <li>Smart contracts and blockchain transactions are irreversible</li>
            </ul>
          </div>

          <div className="space-y-3 pt-4 border-t border-gray-700">
            <h3 className="text-xl font-bold text-purple-400">By using Pixel Race, you acknowledge that you:</h3>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <FiCheckCircle className="text-green-400 mt-1 flex-shrink-0" />
                <span>Understand blockchain technology and its risks</span>
              </li>
              <li className="flex items-start gap-2">
                <FiCheckCircle className="text-green-400 mt-1 flex-shrink-0" />
                <span>Are participating for entertainment/educational purposes only</span>
              </li>
              <li className="flex items-start gap-2">
                <FiCheckCircle className="text-green-400 mt-1 flex-shrink-0" />
                <span>Accept full responsibility for your decisions and actions</span>
              </li>
              <li className="flex items-start gap-2">
                <FiCheckCircle className="text-green-400 mt-1 flex-shrink-0" />
                <span>Will not hold the developers liable for any losses</span>
              </li>
            </ul>
          </div>

          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mt-4">
            <p className="text-yellow-300 font-semibold">
              This platform may contain bugs, may be discontinued at any time, and comes with ABSOLUTELY NO WARRANTY.
            </p>
          </div>

          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mt-4">
            <p className="text-red-300 font-bold text-center text-lg">
              IF YOU DO NOT AGREE, DO NOT USE THIS PLATFORM.
            </p>
          </div>
        </div>

        <div className="bg-gray-800/50 border-t border-gray-700 px-6 py-4">
          <label className="flex items-center gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={isAccepted}
              onChange={(e) => setIsAccepted(e.target.checked)}
              className="w-5 h-5 rounded border-purple-500 bg-gray-700 text-purple-600 focus:ring-2 focus:ring-purple-500 cursor-pointer"
            />
            <span className="text-white group-hover:text-purple-400 transition-colors">
              I understand and accept the risks
            </span>
          </label>

          <button
            onClick={handleAccept}
            disabled={!isAccepted}
            className={`w-full mt-4 py-3 px-6 rounded-lg font-bold text-lg transition-all ${
              isAccepted
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-purple-500/50 transform hover:scale-105'
                : 'bg-gray-700 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isAccepted ? 'Accept and Continue' : 'Please accept to continue'}
          </button>
        </div>
      </div>
    </div>
  );
}
