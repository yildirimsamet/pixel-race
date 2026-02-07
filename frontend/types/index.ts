export interface User {
  id: string;
  wallet_address: string;
  wallet_connected_at: string;
  created_at: string;
  last_login?: string;
  balance?: number;
  goodluck_count: number;
  is_admin?: boolean;
}

export interface HorseStatsDetailResponse {
  base_stats: {
    name: string;
    age: number;
    color: string;
    birthdate: string;
  };
  dynamic_stats: {
    weight: number;
    determination: number;
    satiety: number;
    energy: number;
    level: number;
    speed_score: number;
    bond: number;
    fame: number;
    instinct: number;
  };
  performance: {
    total_races: number;
    total_wins: number;
    win_rate: number;
    total_earnings: number;
    average_earnings: number;
  };
}

export interface HorseStats {
  weight: number;
  determination: number;
  energy: number;
  satiety: number;
  level: number;
  speed_score: number;
  bond: number;
  fame: number;
  instinct: number;
}

export interface HorseStatistics {
  total_races: number;
  total_wins: number;
  total_earnings: number;
}

export interface Horse {
  id: string;
  user_id: string;
  name: string;
  birthdate: string;
  age: number;
  color: string;
  in_race: boolean;
  created_at: string;
  nft_mint_address?: string;
  nft_metadata_uri?: string;
  minted_at?: string;
  stats?: HorseStats | null;
  statistics?: HorseStatistics | null;
}

export interface HorseBuyResponse {
  horse: Horse
  nft_mint: string
  explorer_url: string
  message: string
  transaction_signature: string
}

export interface HorseTrainResponse {
  success: boolean;
  old_determination: number;
  new_determination: number;
  message: string;
}

export interface Race {
  id: string;
  entry_fee: number;
  max_horses: number;
  min_horses: number;
  status: 'waiting' | 'racing' | 'done' | 'cancelled';
  start_time: string;
  level_requirement: number;
  created_at: string;
  registered_horses: number;
}

export interface RaceResult {
  id: string;
  race_id: string;
  horse_id: string;
  horse_name?: string;
  owner_name?: string;
  finish_position: number | null;
  finish_time_ms: number | null;
  reward_amount?: number;
  created_at: string;
  color?: string;
  race_segments?: string;
  goodluck_used: boolean;
}

export type NotificationType = 'race_join' | 'race_win' | 'race_cancelled' | 'refund';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  race_id: string | null;
  horse_id: string | null;
  amount_sol: number | null;
  transaction_signature: string | null;
  is_read: boolean;
  created_at: string;
  read_at: string | null;
}

export type RewardType = 'welcome_box' | 'goodluck' | 'daily_login' | 'special_event';

export interface Reward {
  id: string;
  user_id: string;
  reward_type: RewardType;
  claimed: boolean;
  claimed_at: string | null;
  created_at: string;
}

export interface RaceEndStatsData {
  race_id: string;
  horse: Horse;
  position: number;
  reward_amount: number;
  stats_before: { [key: string]: number };
  stats_after: { [key: string]: number };
  stat_changes: { [key: string]: number };
  horse_age: number;
}

export interface StatChange {
  name: string;
  icon: React.ReactNode;
  color: string;
  before: number;
  after: number;
  change: number;
  unit?: string;
  min: number;
  max: number;
}
