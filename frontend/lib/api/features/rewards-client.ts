import { apiClient } from '../client';
import { ClaimRewardResponse, CheckEligibilityResponse } from '../types';
import { Reward } from '@/types';

export const rewardsApi = {
  getRewards: async (unclaimedOnly?: boolean): Promise<Reward[]> => {
    const { data } = await apiClient.get<Reward[]>('/rewards/', {
      params: { unclaimed_only: unclaimedOnly }
    });
    return data;
  },

  claimReward: async (rewardId: string): Promise<ClaimRewardResponse> => {
    const { data } = await apiClient.post<ClaimRewardResponse>('/rewards/claim', {
      reward_id: rewardId
    });
    return data;
  },

  checkEligibility: async (rewardType: string): Promise<CheckEligibilityResponse> => {
    const { data } = await apiClient.get<CheckEligibilityResponse>(`/rewards/check/${rewardType}`);
    return data;
  },
};
