'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useAuth } from '@/hooks/useAuth';
import { useSolanaBalance } from '@/hooks/useSolanaBalance';
import { toast } from '@/lib/toast';
import { NavbarDesktop } from './NavbarDesktop';
import { NavbarMobile } from './NavbarMobile';
import { NavbarWalletInfo } from './NavbarWalletInfo';
import { HelpButton } from './HelpButton';
import { AdminButton } from './AdminButton';
import NotificationBell from '@/components/NotificationBell';
import WelcomeModal from '@/components/WelcomeModal';

const WalletConnectButton = dynamic(() => import('@/components/WalletConnectButton'), {
  ssr: false,
  loading: () => <div></div>,
});

const FIRST_VISIT_KEY = 'pixel-race-first-visit';

export default function Navbar() {
  const pathname = usePathname();
  const { user, isLoggedIn, logout } = useAuth();
  const { publicKey, connected, disconnect } = useWallet();
  const solBalance = useSolanaBalance(publicKey, connected);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const hasVisited = localStorage.getItem(FIRST_VISIT_KEY);
    if (!hasVisited) {
      setShowWelcomeModal(true);
    }
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : 'unset';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [mobileMenuOpen]);

  const handleDisconnect = async () => {
    try {
      if (disconnect) {
        await disconnect();
      }
      logout();
      setMobileMenuOpen(false);
      toast.info('Wallet disconnected successfully');
    } catch (error: any) {
      toast.error('Failed to disconnect wallet');
    }
  };

  const isFullyAuthenticated = Boolean(isLoggedIn && user && connected);

  return (
    <>
      <nav className="glass fixed top-0 left-0 right-0 z-50 border-b border-transparent animate-fade-in">
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-neon-blue via-neon-purple to-neon-pink opacity-60"></div>

        <div className="container mx-auto px-4 lg:px-6">
          <div className="flex items-center h-16 lg:h-18 gap-8">
            <Link
              href="/"
              className="group flex items-center gap-2.5 text-xl lg:text-2xl font-bold transition-all duration-300 flex-shrink-0"
              aria-label="Pixel Race Home"
            >
              <span className="bg-gradient-to-r from-neon-blue to-neon-purple bg-clip-text text-transparent font-black tracking-tight hidden sm:inline-block group-hover:drop-shadow-[0_0_10px_rgba(181,55,255,0.6)]">
                PIXEL RACE
              </span>
            </Link>

            <NavbarDesktop isLoggedIn={isLoggedIn} pathname={pathname} />

            <div className="flex-1" />

            <div className="hidden lg:flex items-center gap-4 flex-shrink-0">
              <HelpButton onShowWelcome={() => setShowWelcomeModal(true)} />

              {isFullyAuthenticated && (
                <>
                  <NotificationBell />
                  {user?.is_admin && <AdminButton isActive={pathname?.startsWith('/admin')} />}
                  <NavbarWalletInfo
                    balance={solBalance}
                    variant="desktop"
                    onDisconnect={handleDisconnect}
                    walletAddress={publicKey?.toBase58()}
                  />
                </>
              )}

              {!isFullyAuthenticated && <WalletConnectButton />}
            </div>

            <div className="flex lg:hidden items-center gap-2">
              {isFullyAuthenticated && (
                <>
                  <NotificationBell />
                  {user?.is_admin && <AdminButton isActive={pathname?.startsWith('/admin')} />}
                </>
              )}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg hover:bg-white/10 text-gray-300 transition-all duration-300 hover:scale-110 active:scale-95"
                aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={mobileMenuOpen}
              >
                <div className="relative w-6 h-6">
                  <svg
                    className={`text-3xl absolute inset-0 transition-all duration-300 ${mobileMenuOpen ? 'opacity-0 rotate-90 scale-0' : 'opacity-100 rotate-0 scale-100'
                      }`}
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <line x1="3" y1="12" x2="21" y2="12" />
                    <line x1="3" y1="18" x2="21" y2="18" />
                  </svg>
                  <svg
                    className={`text-3xl absolute inset-0 transition-all duration-300 ${mobileMenuOpen ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-0'
                      }`}
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </div>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <NavbarMobile
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        isAuthenticated={isFullyAuthenticated}
        pathname={pathname}
        solBalance={solBalance}
        publicKey={publicKey}
        onShowWelcome={() => setShowWelcomeModal(true)}
        onDisconnect={handleDisconnect}
        isAdmin={user?.is_admin}
      />

      <WelcomeModal
        forceShow={showWelcomeModal}
        onClose={() => {
          setShowWelcomeModal(false);
          localStorage.setItem(FIRST_VISIT_KEY, 'true');
        }}
      />
    </>
  );
}
