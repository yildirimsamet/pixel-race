'use client';

import { FiHelpCircle } from 'react-icons/fi';

interface HelpButtonProps {
  onShowWelcome: () => void;
}

export function HelpButton({ onShowWelcome }: HelpButtonProps) {
  return (
    <button
      onClick={onShowWelcome}
      className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all duration-200 hover:scale-110 active:scale-95"
      aria-label="Help & How to Play"
      title="Help & How to Play"
    >
      <FiHelpCircle className="text-xl" />
    </button>
  );
}
