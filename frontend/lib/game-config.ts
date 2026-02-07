
import gameConfigJson from '../common/game-config.json';

interface PricingConfig {
  horse_purchase: {
    level_1: number;
    level_2: number;
    level_3: number;
  };
  goodluck_token: number;
  race_entry: {
    level_1: number;
    level_2: number;
    level_3: number;
  };
  horse_care: {
    feed: number;
    rest: number;
    train: number;
  };
}

interface RaceConfig {
  min_horses: {
    level_1: number;
    level_2: number;
    level_3: number;
  };
  max_horses: {
    level_1: number;
    level_2: number;
    level_3: number;
  };
  base_time_ms: {
    level_1: number;
    level_2: number;
    level_3: number;
  };
  reward_distribution: {
    first: number;
    second: number;
    third: number;
  };
  reward_distribution_1v1: {
    first: number;
    second: number;
  };
  num_segments: number;
  create_interval_minutes: number;
  start_delay_minutes: number;
}

interface AttributeRange {
  min: number;
  max: number;
}

interface HorseAttributesConfig {
  age: AttributeRange;
  weight: AttributeRange;
  determination: AttributeRange;
  energy: AttributeRange;
  satiety: AttributeRange;
  bond: AttributeRange;
  fame: AttributeRange;
  instinct: AttributeRange;
}

interface OptimalStatConfig {
  value: number;
  max_penalty_ms: number;
}

interface OptimalStatsConfig {
  age: OptimalStatConfig;
  weight: OptimalStatConfig;
  satiety: OptimalStatConfig;
  determination: OptimalStatConfig;
  bond: OptimalStatConfig;
  fame: OptimalStatConfig;
  instinct: OptimalStatConfig;
}

interface RaceLogicConfig {
  segment_speed_variation: {
    min: number;
    max: number;
  };
  high_determination_threshold: number;
  high_determination_boost_segment: number;
  old_age_threshold: number;
  old_age_energy_segment: number;
  young_age_threshold: number;
  young_age_boost_start_segment: number;
  young_age_boost_end_segment: number;
  heavy_weight_threshold: number;
  uphill_start_segment: number;
  uphill_end_segment: number;
}

interface TrainingConfig {
  success_chance: number;
  determination_increase: number;
}

interface GoodLuckTokenConfig {
  max_purchase_quantity: number;
  race_boost_description: string;
}

interface SchedulerConfig {
  stuck_race_timeout_minutes: number;
  max_kept_old_races: number;
}

export interface GameConfig {
  pricing: PricingConfig;
  race: RaceConfig;
  horse_attributes: HorseAttributesConfig;
  optimal_stats: OptimalStatsConfig;
  race_logic: RaceLogicConfig;
  training: TrainingConfig;
  goodluck_token: GoodLuckTokenConfig;
  scheduler: SchedulerConfig;
}

const gameConfig: GameConfig = gameConfigJson as GameConfig;


export function getHorsePrice(level: number): number {
  switch (level) {
    case 1:
      return gameConfig.pricing.horse_purchase.level_1;
    case 2:
      return gameConfig.pricing.horse_purchase.level_2;
    case 3:
      return gameConfig.pricing.horse_purchase.level_3;
    default:
      return gameConfig.pricing.horse_purchase.level_1;
  }
}

export function getHorsePrices(): Record<number, number> {
  return {
    1: gameConfig.pricing.horse_purchase.level_1,
    2: gameConfig.pricing.horse_purchase.level_2,
    3: gameConfig.pricing.horse_purchase.level_3,
  };
}

export function getRaceEntryFee(level: number): number {
  switch (level) {
    case 1:
      return gameConfig.pricing.race_entry.level_1;
    case 2:
      return gameConfig.pricing.race_entry.level_2;
    case 3:
      return gameConfig.pricing.race_entry.level_3;
    default:
      return gameConfig.pricing.race_entry.level_1;
  }
}

export function getGoodLuckPrice(): number {
  return gameConfig.pricing.goodluck_token;
}

export function getHorseCarePrice(action: 'feed' | 'rest' | 'train'): number {
  return gameConfig.pricing.horse_care[action];
}


export function getMinHorses(level: number): number {
  switch (level) {
    case 1:
      return gameConfig.race.min_horses.level_1;
    case 2:
      return gameConfig.race.min_horses.level_2;
    case 3:
      return gameConfig.race.min_horses.level_3;
    default:
      return gameConfig.race.min_horses.level_1;
  }
}

export function getMaxHorses(level: number): number {
  switch (level) {
    case 1:
      return gameConfig.race.max_horses.level_1;
    case 2:
      return gameConfig.race.max_horses.level_2;
    case 3:
      return gameConfig.race.max_horses.level_3;
    default:
      return gameConfig.race.max_horses.level_1;
  }
}

export function getRewardDistribution(): { first: number; second: number; third: number } {
  return gameConfig.race.reward_distribution;
}


export function getMaxGoodLuckQuantity(): number {
  return gameConfig.goodluck_token.max_purchase_quantity;
}

export function getGoodLuckDescription(): string {
  return gameConfig.goodluck_token.race_boost_description;
}


export default gameConfig;
