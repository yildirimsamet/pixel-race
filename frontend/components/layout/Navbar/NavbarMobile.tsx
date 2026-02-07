import { useMemo } from 'react';
import { PublicKey } from '@solana/web3.js';
import { GiHorseHead } from 'react-icons/gi';
import { MdStadium, MdCardGiftcard } from 'react-icons/md';
import { FaWallet } from 'react-icons/fa';
import { IoLogOut, IoHelpCircle, IoInformationCircle, IoClose } from 'react-icons/io5';
import { PiCloverFill } from 'react-icons/pi';
import { FiShield } from 'react-icons/fi';
import dynamic from 'next/dynamic';
import { MobileNavLink } from './MobileNavLink';
import NotificationBell from '@/components/NotificationBell';

const WalletConnectButton = dynamic(() => import('@/components/WalletConnectButton'), {
  ssr: false,
  loading: () => <div></div>,
});

interface NavbarMobileProps {
  isOpen: boolean;
  onClose: () => void;
  isAuthenticated: boolean;
  pathname: string;
  solBalance: number;
  publicKey: PublicKey | null;
  onShowWelcome: () => void;
  onDisconnect: () => void;
  isAdmin?: boolean;
}

export function NavbarMobile({
  isOpen,
  onClose,
  isAuthenticated,
  pathname,
  solBalance,
  publicKey,
  onShowWelcome,
  onDisconnect,
  isAdmin,
}: NavbarMobileProps) {
  const truncatedAddress = useMemo(() => {
    if (!publicKey) return '';
    const address = publicKey.toBase58();
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  }, [publicKey]);

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/70 backdrop-blur-md z-40 lg:hidden transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        className={`fixed top-0 right-0 h-full w-[340px] max-w-[85vw] glass-dark border-l border-purple-500/30 z-50 lg:hidden transform transition-all duration-300 ease-out ${isOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        style={{
          boxShadow: isOpen ? '0 0 50px rgba(181, 55, 255, 0.3)' : 'none',
        }}
      >
        <div className="flex flex-col h-full">
          <div className="border-b border-gradient-to-r from-neon-blue/30 via-neon-purple/30 to-neon-pink/30">
            <div className="flex justify-between items-center p-4">
              <h2 className="text-xl font-bold bg-gradient-to-r from-neon-blue to-neon-purple bg-clip-text text-transparent">
                Menu
              </h2>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-white/10 text-gray-300 transition-all duration-300 hover:rotate-90"
                aria-label="Close menu"
              >
                <IoClose className="text-2xl" />
              </button>
            </div>

            {isAuthenticated && (
              <div className="px-4 pb-4">
                <div className="p-3 bg-gradient-to-br from-purple-600/20 to-pink-600/20 border border-purple-500/40 rounded-lg shadow-neon-purple">
                  <div className="flex items-center gap-2 mb-1.5">
                    <FaWallet className="text-purple-400 text-base" />
                    <span className="text-purple-300 font-bold text-sm">
                      {solBalance.toFixed(4)} SOL
                    </span>
                  </div>
                  <div className="text-xs text-gray-400 font-mono">{truncatedAddress}</div>
                </div>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="p-4 space-y-4">

              <div className="space-y-1">
                <div className="text-xs font-bold text-gray-500 uppercase tracking-widest px-4 py-2">
                  Navigation
                </div>
                <MobileNavLink
                  href="/mystery-box"
                  icon={<MdCardGiftcard />}
                  label="Mystery Box"
                  neonColor="yellow"
                  isActive={pathname === '/mystery-box'}
                  onClick={onClose}
                />
                <MobileNavLink
                  href="/races"
                  icon={<MdStadium />}
                  label="Races"
                  neonColor="purple"
                  isActive={pathname === '/races' || pathname?.startsWith('/race/')}
                  onClick={onClose}
                />
              </div>

              {isAuthenticated && (
                <>
                  <div className="h-[1px] bg-gradient-to-r from-transparent via-purple-500/50 to-transparent"></div>
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-gray-500 uppercase tracking-widest px-4 py-2">
                      My Account
                    </div>
                    <MobileNavLink
                      href="/stable"
                      icon={<GiHorseHead />}
                      label="Stable"
                      neonColor="green"
                      isActive={pathname === '/stable'}
                      onClick={onClose}
                    />
                    <MobileNavLink
                      href="/goodluck"
                      icon={<PiCloverFill />}
                      label="GoodLuck"
                      neonColor="green"
                      isActive={pathname === '/goodluck'}
                      onClick={onClose}
                    />
                  </div>
                </>
              )}

              {isAdmin && (
                <>
                  <div className="h-[1px] bg-gradient-to-r from-transparent via-yellow-500/50 to-transparent"></div>
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-gray-500 uppercase tracking-widest px-4 py-2">
                      Admin
                    </div>
                    <MobileNavLink
                      href="/admin/dashboard"
                      icon={<FiShield />}
                      label="Admin Dashboard"
                      neonColor="yellow"
                      isActive={pathname?.startsWith('/admin')}
                      onClick={onClose}
                    />
                  </div>
                </>
              )}

              <div className="h-[1px] bg-gradient-to-r from-transparent via-neon-pink/50 to-transparent"></div>

              <div className="space-y-1">
                <div className="text-xs font-bold text-gray-500 uppercase tracking-widest px-4 py-2">
                  Help & Info
                </div>
                {isAuthenticated && (
                  <button
                    onClick={() => {
                      onShowWelcome();
                      onClose();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg min-h-[48px] text-gray-300 font-medium hover:bg-white/10 hover:pl-6 hover:text-neon-yellow transition-all duration-300"
                    aria-label="How to Play"
                  >
                    <IoHelpCircle className="text-xl" />
                    <span className="text-base">How to Play</span>
                  </button>
                )}
                <MobileNavLink
                  href="/about"
                  icon={<IoInformationCircle />}
                  label="About"
                  neonColor="pink"
                  isActive={pathname === '/about'}
                  onClick={onClose}
                />
              </div>

              <div className="h-[1px] bg-gradient-to-r from-transparent via-purple-500/50 to-transparent"></div>

              {isAuthenticated ? (
                <button
                  onClick={onDisconnect}
                  className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 px-4 py-3 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 shadow-neon-red hover:shadow-[0_0_30px_rgba(255,0,64,0.8)] font-medium min-h-[48px] hover:scale-[1.02] active:scale-95"
                  aria-label="Disconnect wallet"
                >
                  <IoLogOut className="text-lg" />
                  <span>Disconnect Wallet</span>
                </button>
              ) : (
                <WalletConnectButton />
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
