'use client';

import { useState } from 'react';
import Sidebar from './Sidebar';
import WelcomeModal from '@/components/WelcomeModal';
import TokenLaunchBanner from '@/components/TokenLaunchBanner';

const FIRST_VISIT_KEY = 'pixel-race-first-visit';

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);


  return (
    <>
      <div className="flex min-h-screen">
        <Sidebar onShowWelcome={() => setShowWelcomeModal(true)} />

        <main className="flex-1 min-h-screen">
          <TokenLaunchBanner />
          <div className="px-4 sm:px-6 lg:px-8 py-8">
          <div className='!hidden !invisible
            bg-neon-blue
            bg-neon-purple
            bg-neon-pink
            bg-neon-green
            bg-neon-yellow
            bg-neon-orange
            bg-neon-yellow
            text-neon-blue
            text-neon-purple
            text-neon-pink
            text-neon-green
            text-neon-yellow
            text-neon-orange
            text-neon-yellow'></div>
          {children}
          </div>
        </main>
      </div>

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
