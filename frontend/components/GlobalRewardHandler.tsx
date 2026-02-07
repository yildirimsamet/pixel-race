'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useRewards } from '@/hooks/useRewards';
import RewardModal from '@/components/RewardModal';
import HorseRevealModal from '@/components/HorseRevealModal';
import { Reward, Horse } from '@/types';
import { horses as horsesApi } from '@/lib/api';

const SESSION_DISMISSED_KEY = 'reward-modal-dismissed';

export default function GlobalRewardHandler() {
  const router = useRouter();
  const { isLoggedIn } = useAuth();
  const { unclaimedRewards, claimReward, refetch } = useRewards();
  const [currentReward, setCurrentReward] = useState<Reward | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [isRevealModalOpen, setIsRevealModalOpen] = useState(false);
  const [revealedHorse, setRevealedHorse] = useState<Horse | null>(null);

  useEffect(() => {
    if (!isLoggedIn || unclaimedRewards.length === 0) {
      return;
    }

    if (isModalOpen) {
      return;
    }

    const sessionDismissed = sessionStorage.getItem(SESSION_DISMISSED_KEY);
    if (sessionDismissed) {
      return;
    }

    const firstUnclaimedReward = unclaimedRewards[0];
    setCurrentReward(firstUnclaimedReward);
    setIsModalOpen(true);
  }, [isLoggedIn, unclaimedRewards, isModalOpen]);

  useEffect(() => {
    const handleRaceEndEvent = async () => {
      await refetch();
    };

    const handleLoginEvent = async () => {
      await refetch();
    };

    window.addEventListener('raceEndRewardCheck', handleRaceEndEvent);
    window.addEventListener('userLoggedIn', handleLoginEvent);

    return () => {
      window.removeEventListener('raceEndRewardCheck', handleRaceEndEvent);
      window.removeEventListener('userLoggedIn', handleLoginEvent);
    };
  }, [refetch]);

  const handleClaimReward = async (rewardId: string) => {
    const response = await claimReward(rewardId);

    sessionStorage.removeItem(SESSION_DISMISSED_KEY);

    if (response?.horse_id) {
      try {
        const horseData = await horsesApi.getAll();
        const claimedHorse = horseData.find(h => h.id === response.horse_id);

        if (claimedHorse) {
          const statsData = await horsesApi.getStats(response.horse_id);

          const fullHorse: Horse = {
            ...claimedHorse,
            stats: statsData.dynamic_stats,
          };

          setIsModalOpen(false);
          setCurrentReward(null);

          setRevealedHorse(fullHorse);
          setIsRevealModalOpen(true);
        } else {
          router.push('/stable');
        }
      } catch (error) {
        console.error('Failed to fetch horse:', error);
        router.push('/stable');
      }
    } else {
      await refetch();
      setIsModalOpen(false);
      setCurrentReward(null);
    }
  };

  const handleCloseModal = () => {
    sessionStorage.setItem(SESSION_DISMISSED_KEY, 'true');
    setIsModalOpen(false);
    setCurrentReward(null);
  };

  const handleRevealComplete = () => {
    setIsRevealModalOpen(false);
    setRevealedHorse(null);
  };

  return (
    <>
      <RewardModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        reward={currentReward}
        onClaim={handleClaimReward}
      />

      <HorseRevealModal
        isOpen={isRevealModalOpen}
        horse={revealedHorse}
        onComplete={handleRevealComplete}
      />
    </>
  );
}
