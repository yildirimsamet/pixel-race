
export interface LoginResponse {
  access_token: string;
  token_type: string;
}

export interface WalletLoginRequest {
  wallet_address: string;
  signature: string;
  message: string;
}

export interface ValidationResponse {
  can_join?: boolean;
  can_buy?: boolean;
  message?: string;
  error?: string;
  reason?: string;
  entry_fee?: number;
  price_sol?: number;
  level?: number;
}

export interface TransactionSignatureRequest {
  transaction_signature: string;
}

export interface BuyBoxRequest {
  max_level: number;
  transaction_signature?: string;
}

export interface JoinRaceRequest {
  horse_id: string;
  transaction_signature?: string;
}

export interface Transaction {
  type: 'race_entry' | 'race_reward';
  signature: string;
  amount_sol: number;
  horse_name: string;
  horse_id: string;
  race_id: string;
  race_level: number;
  finish_position?: number;
  timestamp: string;
  explorer_url: string;
}

export interface TransactionHistoryResponse {
  transactions: Transaction[];
  total_count: number;
  wallet_address: string;
}

export interface BuyGoodLuckRequest {
  transaction_signature: string;
  quantity: number;
}

export interface UseGoodLuckRequest {
  horse_id: string;
}

export interface GoodLuckResponse {
  message: string;
  new_count: number;
}

export interface ClaimRewardResponse {
  success: boolean;
  reward: any;
  message: string;
  horse_id?: string;
}

export interface CheckEligibilityResponse {
  has_reward: boolean;
  reward_type: string;
  message: string;
}
