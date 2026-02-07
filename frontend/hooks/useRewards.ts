import { useState, useEffect, useCallback } from 'react';
import { rewards as rewardsApi, ClaimRewardResponse } from '@/lib/api';
import { Reward } from '@/types';
import { ApiError } from '@/lib/api';
import { toast } from '@/lib/toast';

interface UseRewardsResult {
  unclaimedRewards: Reward[];
  claimReward: (rewardId: string) => Promise<ClaimRewardResponse | null>;
  checkEligibility: (rewardType: string) => Promise<boolean>;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useRewards(): UseRewardsResult {
  const [unclaimedRewards, setUnclaimedRewards] = useState<Reward[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUnclaimedRewards = useCallback(async () => {
    if (typeof window === 'undefined') return;

    setIsLoading(true);
    setError(null);

    try {
      const rewards = await rewardsApi.getRewards(true);
      setUnclaimedRewards(rewards);
    } catch (err) {
      if (err instanceof ApiError && err.statusCode === 401) {
        setUnclaimedRewards([]);
        setError(null);
      } else {
        const errorMessage = err instanceof ApiError ? err.message : 'Failed to fetch rewards';
        setError(errorMessage);
        console.error('Failed to fetch unclaimed rewards:', err);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const claimReward = useCallback(async (rewardId: string): Promise<ClaimRewardResponse | null> => {
    const reward = unclaimedRewards.find(r => r.id === rewardId);
    if (!reward || reward.claimed) {
      console.error('Reward already claimed or not found');
      toast.error('Reward already claimed or not found');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await rewardsApi.claimReward(rewardId);
      toast.success(response.message);
      await fetchUnclaimedRewards();
      return response;
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Failed to claim reward';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Failed to claim reward:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [unclaimedRewards, fetchUnclaimedRewards]);

  const checkEligibility = useCallback(async (rewardType: string): Promise<boolean> => {
    try {
      const response = await rewardsApi.checkEligibility(rewardType);
      return response.has_reward;
    } catch (err) {
      console.error('Failed to check reward eligibility:', err);
      return false;
    }
  }, []);

  useEffect(() => {
    fetchUnclaimedRewards();

    const handleAuthLogin = () => {
      fetchUnclaimedRewards();
    };

    const handleAuthLogout = () => {
      setUnclaimedRewards([]);
      setIsLoading(false);
      setError(null);
    };

    window.addEventListener('auth:login', handleAuthLogin);
    window.addEventListener('auth:unauthorized', handleAuthLogout);

    return () => {
      window.removeEventListener('auth:login', handleAuthLogin);
      window.removeEventListener('auth:unauthorized', handleAuthLogout);
    };
  }, [fetchUnclaimedRewards]);

  return {
    unclaimedRewards,
    claimReward,
    checkEligibility,
    isLoading,
    error,
    refetch: fetchUnclaimedRewards,
  };
}
