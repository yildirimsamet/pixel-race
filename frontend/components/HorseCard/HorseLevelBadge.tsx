import { motion } from 'framer-motion';
import { memo } from 'react';
import { HorseLevelBadgeProps } from './types';
import { LEVEL_CONFIG } from './constants';

function HorseLevelBadge({ level, variant = 'small' }: HorseLevelBadgeProps) {
  const config = LEVEL_CONFIG[level as keyof typeof LEVEL_CONFIG] || LEVEL_CONFIG[1];

  if (variant === 'large') {
    return (
      <div className={`${config.badge} px-3 py-1 rounded-full inline-flex items-center gap-2 shadow-lg`}>
        <span className="text-sm">{config.icon}</span>
        <span className="text-xs font-bold text-white">Level {level}</span>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      whileHover={{ scale: 1.1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 15 }}
      className="absolute top-2 right-2 z-20"
    >
      <div className={`${config.badge} px-1 py-1 rounded-full flex items-center gap-2 border-2 ${config.border} shadow-lg`}>
        <span className="text-xs">{config.icon}</span>
        <span className="text-[10px] font-bold text-white">Lvl {level}</span>
      </div>
    </motion.div>
  );
}

export default memo(HorseLevelBadge);
