import type { Metadata, Viewport } from 'next';
import './globals.css';
import 'react-toastify/dist/ReactToastify.css';
import MainLayout from '@/components/layout/MainLayout';
import Footer from '@/components/layout/Footer';
import DisclaimerModal from '@/components/DisclaimerModal';
import WalletProvider from '@/components/WalletProvider';
import WalletDisconnectHandler from '@/components/WalletDisconnectHandler';
import ErrorBoundary from '@/components/ErrorBoundary';
import GlobalSocketListeners from '@/components/GlobalSocketListeners';
import GlobalRewardHandler from '@/components/GlobalRewardHandler';
import NProgressBar from '@/components/NProgressBar';
import { ToastContainer } from 'react-toastify';

export const metadata: Metadata = {
  metadataBase: new URL('https://pixelrace.online'),
  title: {
    default: 'Pixel Race - NFT Horse Racing Game',
    template: '%s | Pixel Race',
  },
  description: 'Real-time multiplayer horse racing game on Solana blockchain. Collect, train, and race NFT horses to win rewards.',
  keywords: ['NFT', 'horse racing', 'Solana', 'blockchain', 'gaming', 'web3'],
  authors: [{ name: 'Pixel Race Team' }],
  openGraph: {
    title: 'Pixel Race - NFT Horse Racing Game',
    description: 'Real-time multiplayer horse racing game on Solana blockchain',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pixel Race - NFT Horse Racing Game',
    description: 'Real-time multiplayer horse racing game on Solana blockchain',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
      <link rel="icon" href="/favicon.ico" sizes="any" />
        <link
          rel="preload"
          href="https://www.lorp.org/fonts/MuybridgeGX.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      </head>
      <body className="antialiased">
        <NProgressBar />
        <div className="lg:hidden fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-6">
          <div className="text-center space-y-6 max-w-md">
            <div className="text-6xl animate-bounce">🖥️</div>
            <h1 className="text-3xl font-bold text-white">Desktop Required</h1>
            <p className="text-xl text-gray-300">
              For the best gaming experience, please access Pixel Race from a desktop computer.
            </p>
            <p className="text-lg text-gray-400">
              Mobile version is not available yet.
            </p>
          </div>
        </div>
        <div className="lg:block">
          <ErrorBoundary>
            <WalletProvider>
              <DisclaimerModal />
              <WalletDisconnectHandler />
              <GlobalSocketListeners />
              <GlobalRewardHandler />
              <MainLayout>
                {children}
              </MainLayout>
              <Footer />
              <ToastContainer
                position="bottom-right"
                autoClose={5000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="dark"
              />
            </WalletProvider>
          </ErrorBoundary>
        </div>
      </body>
    </html>
  );
}
