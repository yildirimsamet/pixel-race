import { IoLogOut, IoHelpCircle } from 'react-icons/io5';
import NotificationBell from '@/components/NotificationBell';

interface NavbarUserActionsProps {
  onShowWelcome: () => void;
  onDisconnect: () => void;
}

export function NavbarUserActions({ onShowWelcome, onDisconnect }: NavbarUserActionsProps) {
  return (
    <>
      <button
        onClick={onShowWelcome}
        className="p-2 rounded-lg hover:bg-white/10 text-gray-300 hover:text-neon-yellow transition-all duration-300 hover:scale-110 group"
        aria-label="How to Play"
        title="How to Play"
      >
        <IoHelpCircle className="text-2xl transition-all duration-300 group-hover:drop-shadow-[0_0_10px_rgba(255,234,0,0.8)]" />
      </button>

      <NotificationBell />

      <button
        onClick={onDisconnect}
        className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 px-4 py-2 rounded-lg transition-all duration-300 flex items-center gap-2 shadow-neon-red hover:shadow-[0_0_30px_rgba(255,0,64,0.8)] hover:scale-105 font-medium text-sm"
        aria-label="Disconnect wallet"
      >
        <IoLogOut className="text-lg" />
        <span>Disconnect</span>
      </button>
    </>
  );
}
