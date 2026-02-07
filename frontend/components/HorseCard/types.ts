import { Horse } from '@/types';

export type DensityLevel = 'minimal' | 'compact' | 'comfortable' | 'detailed';
export type HorseCardVariant = 'default' | 'compact' | 'selectable' | 'reveal' | 'minimal';

export interface HorseCardProps {
  horse: Horse;

  density?: DensityLevel;
  variant?: HorseCardVariant;

  showNFT?: boolean;
  showRevealAnimation?: boolean;
  showValidation?: boolean;
  showSelectBadge?: boolean;
  showPerformance?: boolean;
  showStats?: boolean;

  onClick?: () => void;
  onNFTClick?: () => void;
  selected?: boolean;
  disabled?: boolean;
  disabledReason?: string;

  className?: string;
}

export interface HorseAvatarProps {
  color: string;
  size?: 'small' | 'medium' | 'large';
  showAnimation?: boolean;
}

export interface HorseLevelBadgeProps {
  level: 1 | 2 | 3;
  variant?: 'small' | 'large';
}

export interface HorseStatBarProps {
  name: string;
  value: number;
  max: number;
  min?: number;
  unit?: string;
  icon: React.ReactNode;
  color: string;
  showProgressBar?: boolean;
  description?: string;
}
