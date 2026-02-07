import { motion } from 'framer-motion';
import { memo } from 'react';
import { HorseAvatarProps } from './types';

const isValidColor = (color: string): boolean => {
  return /^#[0-9A-F]{6}$/i.test(color);
};

const SIZE_CONFIG = {
  small: {
    container: 'w-16 h-16 rounded-2xl',
    emoji: 'text-4xl',
  },
  medium: {
    container: 'w-20 h-20 rounded-2xl p-3',
    emoji: 'text-5xl',
  },
  large: {
    container: 'w-24 h-24 rounded-xl p-3',
    emoji: 'text-6xl',
  },
};

function HorseAvatar({ color, size = 'medium', showAnimation = false }: HorseAvatarProps) {
  const safeColor = isValidColor(color) ? color : '#ffffff';
  const config = SIZE_CONFIG[size];

  const Container = showAnimation ? motion.div : 'div';
  const animationProps = showAnimation ? {
    whileHover: { rotate: [0, -10, 10, -10, 0], scale: 1.1 },
    transition: { duration: 0.5 }
  } : {};

  return (
    <Container
      className={`${config.container} glass border horse-animated-slow flex items-center justify-center relative overflow-hidden`}
      style={{
        borderColor: `${safeColor}40`,
        boxShadow: `0 0 20px ${safeColor}30`,
      }}
      {...animationProps}
    >
      <div
        className={`${config.emoji} leading-none`}
        style={{
          color: safeColor,
          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))',
          fontFamily: "'Muybridge', 'Apple Color Emoji', 'Segoe UI Emoji', sans-serif",
        }}
      >
        🐎
      </div>
    </Container>
  );
}

export default memo(HorseAvatar);
