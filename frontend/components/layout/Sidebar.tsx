'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useWallet } from '@solana/wallet-adapter-react';
import { useAuth } from '@/hooks/useAuth';
import { useSolanaBalance } from '@/hooks/useSolanaBalance';
import dynamic from 'next/dynamic';
import {
  FaHome,
  FaTrophy,
  FaInfoCircle,
  FaQuestionCircle,
  FaChevronLeft,
  FaChevronRight,
  FaBell,
  FaCrown,
  FaWallet,
  FaSignOutAlt,
  FaGift,
  FaCoins
} from 'react-icons/fa';
import { GiHorseHead } from 'react-icons/gi';
import { PiCloverFill } from 'react-icons/pi';
import { toast } from '@/lib/toast';
import NotificationBell from '@/components/NotificationBell';

const WalletConnectButton = dynamic(() => import('@/components/WalletConnectButton'), {
  ssr: false,
  loading: () => <div></div>,
});

interface NavItem {
  label: string;
  href?: string;
  icon: React.ReactNode;
  onClick?: () => void;
  badge?: number;
  requiresAuth?: boolean;
  requiresAdmin?: boolean;
  neonColor?: string;
}

interface SidebarProps {
  onShowWelcome: () => void;
}

export default function Sidebar({ onShowWelcome }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isWalletSigning, setIsWalletSigning] = useState(false);
  const pathname = usePathname();
  const { user, isLoggedIn, logout } = useAuth();
  const { connected, disconnect, publicKey } = useWallet();
  const solBalance = useSolanaBalance(publicKey, connected);

  const isFullyAuthenticated = Boolean(isLoggedIn && user && connected && !isWalletSigning);
  const isAdmin = Boolean(user?.is_admin);

  const navItems: NavItem[] = [
    {
      label: 'Home',
      href: '/',
      icon: <FaHome className="w-5 h-5" />,
      neonColor: 'blue',
    },
    {
      label: 'Mystery Box',
      href: '/mystery-box',
      icon: <FaGift className="w-5 h-5" />,
      neonColor: 'yellow',
    },
    {
      label: 'Races',
      href: '/races',
      icon: <FaTrophy className="w-5 h-5" />,
      neonColor: 'purple',
    },
    {
      label: 'Token Info',
      href: '/token',
      icon: <FaCoins className="w-5 h-5" />,
      neonColor: 'yellow',
    },
    {
      label: 'About',
      href: '/about',
      icon: <FaInfoCircle className="w-5 h-5" />,
      neonColor: 'pink',
    },
    {
      label: 'How to Play',
      icon: <FaQuestionCircle className="w-5 h-5" />,
      onClick: onShowWelcome,
      neonColor: 'green',
    },
  ];

  const userItems: NavItem[] = [
    {
      label: 'My Stable',
      href: '/stable',
      icon: <GiHorseHead className="w-5 h-5" />,
      requiresAuth: true,
      neonColor: 'green',
    },
    {
      label: 'GoodLuck',
      href: '/goodluck',
      icon: <PiCloverFill className="w-5 h-5" />,
      requiresAuth: true,
      neonColor: 'green',
    },
  ];

  const adminItem: NavItem = {
    label: 'Admin Panel',
    href: '/admin/dashboard',
    icon: <FaCrown className="w-5 h-5" />,
    requiresAdmin: true,
    neonColor: 'orange',
  };

  const handleDisconnect = async () => {
    try {
      if (disconnect) {
        await disconnect();
      }
      logout();
      toast.info('Wallet disconnected');
    } catch (error) {
      toast.error('Failed to disconnect');
    }
  };

  const isActive = (href?: string) => {
    if (!href) return false;
    if (href === '/') return pathname === '/';
    return pathname?.startsWith(href);
  };

  const getNeonColor = (color?: string) => {
    const colors: Record<string, string> = {
      blue: '#3b82f6',
      yellow: '#eab308',
      purple: '#a855f7',
      pink: '#ec4899',
      green: '#10b981',
      orange: '#f97316',
    };
    return colors[color || 'blue'];
  };

  return (
    <>
      <motion.aside
        initial={false}
        animate={{ width: isCollapsed ? 80 : 256 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="hidden lg:block fixed left-0 top-0 h-screen z-50 glass border-r border-white/10"
        style={{
          backdropFilter: 'blur(20px)',
          background: 'linear-gradient(180deg, rgba(10, 10, 20, 0.95) 0%, rgba(20, 20, 35, 0.95) 100%)',
        }}
      >
        <div className="absolute right-0 top-0 bottom-0 w-[2px] bg-gradient-to-b from-neon-blue via-neon-purple to-neon-pink opacity-60" />

        <div className="flex flex-col h-full p-4">
          <div className="flex items-center justify-between mb-8">
            <AnimatePresence mode="wait">
              {!isCollapsed && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <Link
                    href="/"
                    className="text-xl font-black bg-gradient-to-r from-neon-blue to-neon-purple bg-clip-text text-transparent hover:drop-shadow-[0_0_10px_rgba(181,55,255,0.6)] transition-all"
                  >
                    PIXEL RACE
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-all duration-200 hover:scale-110"
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed ? (
                <FaChevronRight className="w-5 h-5" />
              ) : (
                <FaChevronLeft className="w-5 h-5" />
              )}
            </button>
          </div>

          <nav className="flex-1 space-y-2">
            <div className="space-y-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.label}
                  item={item}
                  isActive={isActive(item.href)}
                  isCollapsed={isCollapsed}
                  neonColor={getNeonColor(item.neonColor)}
                />
              ))}
            </div>

            {isFullyAuthenticated && (
              <div className="my-4 h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />
            )}

            {isFullyAuthenticated && (
              <div className="space-y-1">
                {!isCollapsed && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider"
                  >
                    My Account
                  </motion.div>
                )}
                {userItems.map((item) => (
                  <NavLink
                    key={item.label}
                    item={item}
                    isActive={isActive(item.href)}
                    isCollapsed={isCollapsed}
                    neonColor={getNeonColor(item.neonColor)}
                  />
                ))}

                <div className="relative">
                  {isCollapsed ? (
                    <div className="flex items-center justify-center p-3 rounded-lg hover:bg-white/10 transition-all">
                      <NotificationBell />
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 transition-all">
                      <FaBell className="w-5 h-5 text-gray-400" />
                      <span className="text-sm font-medium text-gray-300">Notifications</span>
                      <div className="ml-auto">
                        <NotificationBell />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {isAdmin && (
              <>
                <div className="my-4 h-px bg-gradient-to-r from-transparent via-orange-500/30 to-transparent" />
                <NavLink
                  item={adminItem}
                  isActive={isActive(adminItem.href)}
                  isCollapsed={isCollapsed}
                  neonColor={getNeonColor(adminItem.neonColor)}
                />
              </>
            )}
          </nav>

          <div className="pt-4 mt-4 border-t border-white/10 space-y-3">
            {!isFullyAuthenticated ? (
              <div className={'flex justify-center'}>
                <WalletConnectButton
                  compact={isCollapsed}
                  onSigningStateChange={setIsWalletSigning}
                />
              </div>
            ) : (
              <>
                <div className={`
                  ${isCollapsed ? 'flex flex-col items-center gap-2' : 'space-y-2'}
                `}>
                  {!isCollapsed && (
                    <>
                      <div className="px-3 py-2 rounded-lg bg-purple-500/10 border border-purple-500/30">
                        <div className="flex items-center gap-2 mb-1">
                          <FaWallet className="w-3 h-3 text-purple-400" />
                          <span className="text-xs text-gray-400">Wallet</span>
                        </div>
                        <p className="text-xs font-mono text-white truncate">
                          {publicKey?.toBase58().slice(0, 4)}...{publicKey?.toBase58().slice(-4)}
                        </p>
                      </div>

                      <div className="px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/30">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs text-gray-400">Balance</span>
                        </div>
                        <p className="text-sm font-bold text-green-400">
                          {(!!solBalance || solBalance == 0) ? solBalance.toFixed(4) : '-.----'} SOL
                        </p>
                      </div>
                    </>
                  )}

                  {isCollapsed && (
                    <div className="relative group">
                      <div className="px-3.5 py-2.5 rounded-lg bg-purple-500/10 border border-purple-500/30">
                        <FaWallet className="w-4 h-4 text-purple-400" />
                      </div>
                      <div className="absolute left-full ml-2 top-0 px-3 py-2 bg-gray-900 border border-purple-500/30 rounded-lg shadow-xl whitespace-nowrap z-50 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        <div className="text-xs space-y-1">
                          <p className="text-gray-400">Wallet</p>
                          <p className="font-mono text-white">
                            {publicKey?.toBase58().slice(0, 8)}...
                          </p>
                          <p className="text-green-400 font-bold">
                            {(!!solBalance || solBalance == 0) ? solBalance.toFixed(4) : '-.----'} SOL
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleDisconnect}
                  className={`
                    w-full px-3 py-2.5 rounded-lg
                    bg-red-500/10 hover:bg-red-500/20
                    border border-red-500/30 hover:border-red-500/50
                    text-red-400 hover:text-red-300
                    text-sm font-medium
                    transition-all duration-200
                    flex items-center gap-2
                    ${isCollapsed ? 'justify-center' : ''}
                  `}
                >
                  <FaSignOutAlt className="w-4 h-4" />
                  {!isCollapsed && <span>Disconnect</span>}
                </button>
              </>
            )}
          </div>
        </div>
      </motion.aside>

      <div
        className="transition-all duration-300"
        style={{ width: isCollapsed ? 80 : 256 }}
      />
    </>
  );
}

interface NavLinkProps {
  item: NavItem;
  isActive: boolean;
  isCollapsed: boolean;
  neonColor: string;
}

function NavLink({ item, isActive, isCollapsed, neonColor }: NavLinkProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  const content = (
    <motion.div
      className={`
        relative flex items-center gap-3 px-3 py-2.5 rounded-lg
        transition-all duration-200 cursor-pointer group
        ${isActive
          ? 'bg-white/10 text-white'
          : 'text-gray-400 hover:text-white hover:bg-white/5'
        }
        ${isCollapsed ? 'justify-center' : ''}
      `}
      style={
        isActive
          ? {
            boxShadow: `0 0 20px ${neonColor}40`,
            borderLeft: `3px solid ${neonColor}`,
          }
          : {}
      }
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onMouseEnter={() => isCollapsed && setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <span
        className="transition-all duration-200"
        style={isActive ? { color: neonColor, filter: `drop-shadow(0 0 8px ${neonColor})` } : {}}
      >
        {item.icon}
      </span>

      <AnimatePresence mode="wait">
        {!isCollapsed && (
          <motion.span
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
            className="text-sm font-medium whitespace-nowrap"
          >
            {item.label}
          </motion.span>
        )}
      </AnimatePresence>

      {!isActive && (
        <motion.div
          className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
          style={{
            background: `linear-gradient(90deg, transparent, ${neonColor}10, transparent)`,
          }}
        />
      )}

      <AnimatePresence>
        {isCollapsed && showTooltip && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="absolute left-full ml-2 px-3 py-2 bg-gray-900 border border-purple-500/30 rounded-lg shadow-xl whitespace-nowrap z-50"
            style={{ boxShadow: `0 0 20px ${neonColor}40` }}
          >
            <span className="text-sm font-medium text-white">{item.label}</span>
            <div
              className="absolute right-full top-1/2 -translate-y-1/2 border-8 border-transparent border-r-gray-900"
              style={{ marginRight: -1 }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );

  if (item.href) {
    return <Link href={item.href}>{content}</Link>;
  }

  if (item.onClick) {
    return <div onClick={item.onClick}>{content}</div>;
  }

  return content;
}
