import { memo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HorseStatBarProps } from './types';

function HorseStatBar({
  name,
  value,
  max,
  min = 0,
  unit = '',
  icon,
  color,
  showProgressBar = false,
  description
}: HorseStatBarProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  const percentage = min !== undefined && min > 0
    ? Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100))
    : Math.max(0, Math.min(100, (value / max) * 100));

  const gradientColor = color.replace('text-', '');
  const borderColor = color.replace('text-', '').replace('neon-', '');

  const getBorderColorStyle = () => {
    const colorMap: Record<string, string> = {
      'neon-green': 'rgba(57, 255, 20, 0.4)',
      'neon-orange': 'rgba(255, 159, 64, 0.4)',
      'neon-blue': 'rgba(59, 130, 246, 0.4)',
      'pink-500': 'rgba(236, 72, 153, 0.4)',
      'purple-500': 'rgba(168, 85, 247, 0.4)',
      'cyan-500': 'rgba(6, 182, 212, 0.4)',
      'neon-yellow': 'rgba(255, 255, 0, 0.4)',
      'neon-pink': 'rgba(255, 105, 180, 0.4)',
    };
    return colorMap[borderColor] || 'rgba(255, 255, 255, 0.4)';
  };

  return (
    <div
      className="relative"
      onMouseEnter={() => description && setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div
        className="glass rounded-xl p-3 border transition-all duration-300 cursor-help"
        style={{
          borderColor: showTooltip ? getBorderColorStyle() : 'rgba(255, 255, 255, 0.1)',
        }}
      >
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-400 flex items-center gap-2 text-sm">
            <span className={`${color}`}>{icon}</span>
            {name}
          </span>
          <span className={`font-bold ${color}`}>
            {unit === 'kg' ? value.toFixed(0) : value}
            {unit && ` ${unit}`}
          </span>
        </div>
        {showProgressBar && (
          <div className="w-full h-1.5 bg-dark-700 rounded-full overflow-hidden">
            <div
              className={`h-full bg-${gradientColor} transition-all duration-500`}
              style={{ width: `${percentage}%` }}
            />
          </div>
        )}
      </div>

      <AnimatePresence>
        {showTooltip && description && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="absolute z-50 left-0 right-0 mt-2 pointer-events-none"
          >
            <div
              className="glass rounded-lg p-3 border shadow-2xl backdrop-blur-xl"
              style={{
                borderColor: getBorderColorStyle(),
                boxShadow: `0 0 20px ${getBorderColorStyle()}`,
              }}
            >
              <div className="flex items-start gap-2">
                <span className={`${color} text-lg flex-shrink-0`}>{icon}</span>
                <p className="text-xs text-gray-300 leading-relaxed whitespace-pre-line">{description}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default memo(HorseStatBar);
