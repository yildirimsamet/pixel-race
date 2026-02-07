import { DensityLevel } from './types';

export const DENSITY_CONFIG: Record<DensityLevel, {
  stats: string[];
  showProgressBars: boolean;
  showHoverEffects: boolean;
  avatarSize: 'small' | 'medium' | 'large';
  cardPadding: string;
}> = {
  minimal: {
    stats: [],
    showProgressBars: false,
    showHoverEffects: false,
    avatarSize: 'small',
    cardPadding: 'p-4',
  },
  compact: {
    stats: ['age', 'weight','determination', 'bond', 'fame', 'instinct', 'energy', 'satiety'],
    showProgressBars: false,
    showHoverEffects: false,
    avatarSize: 'medium',
    cardPadding: 'p-4',
  },
  comfortable: {
    stats: ['age', 'weight','determination', 'bond', 'fame', 'instinct', 'energy', 'satiety'],
    showProgressBars: true,
    showHoverEffects: true,
    avatarSize: 'medium',
    cardPadding: 'p-5',
  },
  detailed: {
    stats: ['age', 'weight','determination', 'bond', 'fame', 'instinct', 'energy', 'satiety'],
    showProgressBars: true,
    showHoverEffects: true,
    avatarSize: 'large',
    cardPadding: 'p-6',
  },
};

export const STAT_META: Record<string, {
  iconName: string;
  color: string;
  max: number;
  min?: number;
  unit?: string;
  description?: string;
}> = {
  energy: {
    iconName: 'FaBolt',
    color: 'text-neon-green',
    max: 100,
    description: 'Range: 0-100\nRace Impact: None\nDescription: Shows the horse\'s energy level. Decreases by 10 each race and slowly regenerates over time.\nChangeable: Can be restored to 100 by resting.'
  },
  satiety: {
    iconName: 'MdFastfood',
    color: 'text-neon-orange',
    max: 100,
    description: 'Range: 0-100\nRace Impact: Yes\nDescription: Shows the horse\'s satiety level. Decreases by 10 each race and slowly decreases over time.\nChangeable: Can be restored to 100 by feeding.'
  },
  determination: {
    iconName: 'GiMuscleUp',
    color: 'text-neon-blue',
    max: 100,
    description: 'Range: 0-100\nRace Impact: Yes\nDescription: Shows the horse\'s determination and resolve.\nChangeable: Can be increased through training.'
  },
  bond: {
    iconName: 'FaHeart',
    color: 'text-pink-500',
    max: 100,
    description: 'Range: 0-100\nRace Impact: Yes\nDescription: Shows the bond between the horse and its owner.\nChangeable: Increases by 2 each race. Resets when the horse is sold to another user.'
  },
  fame: {
    iconName: 'FaTrophy',
    color: 'text-purple-500',
    max: 100,
    description: 'Range: 0-100\nRace Impact: None\nDescription: Shows the horse\'s fame level.\nChangeable: Increases based on race performance. 1st place: +3, 2nd place: +2, 3rd place: +1'
  },
  instinct: {
    iconName: 'FaBrain',
    color: 'text-cyan-500',
    max: 100,
    description: 'Range: 0-100\nRace Impact: Yes\nDescription: Shows the horse\'s instinct.\nChangeable: 25% chance to increase by 2 each race.'
  },
  weight: {
    iconName: 'FaWeight',
    color: 'text-neon-yellow',
    min: 300,
    max: 1000,
    unit: 'kg',
    description: 'Range: 300-1000 kg\nRace Impact: Yes\nDescription: Shows the horse\'s weight.\nChangeable: Unchangeable.'
  },
  age: {
    iconName: 'FaBirthdayCake',
    color: 'text-neon-pink',
    max: 10,
    unit: 'y',
    description: 'Range: 1-10 years\nRace Impact: Yes\nDescription: Shows the horse\'s age.\nChangeable: Unchangeable.'
  },
  speed_score: {
    iconName: 'MdStars',
    color: 'text-neon-purple',
    max: 100,
    description: 'Range: 0-100\nRace Impact: Yes\nDescription: Shows the horse\'s overall performance metric. Calculated from all stats.\nChangeable: Automatically updates when other stats change.'
  },
};

export const LEVEL_CONFIG = {
  1: {
    badge: 'bg-gradient-to-r from-orange-500 to-amber-600',
    border: 'border-orange-500/50',
    glow: 'shadow-orange-500/50',
    text: 'text-orange-400',
    name: 'Bronze',
    icon: '🥉'
  },
  2: {
    badge: 'bg-gradient-to-r from-gray-400 to-gray-600',
    border: 'border-gray-400/50',
    glow: 'shadow-gray-400/50',
    text: 'text-gray-300',
    name: 'Silver',
    icon: '🥈'
  },
  3: {
    badge: 'bg-gradient-to-r from-yellow-400 to-yellow-600',
    border: 'border-yellow-500/50',
    glow: 'shadow-yellow-500/50',
    text: 'text-yellow-400',
    name: 'Gold',
    icon: '🥇'
  }
};
