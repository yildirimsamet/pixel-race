import { motion } from 'framer-motion';
import { memo } from 'react';
import { useRouter } from 'next/navigation';
import { FaExclamationTriangle, FaFlag } from 'react-icons/fa';
import { TbSparkles } from 'react-icons/tb';
import { MdStars } from 'react-icons/md';
import HorseAvatar from './HorseAvatar';
import HorseLevelBadge from './HorseLevelBadge';
import HorseStatBar from './HorseStatBar';
import { HorseCardProps } from './types';
import { DENSITY_CONFIG, STAT_META, LEVEL_CONFIG } from './constants';
import { getStatIcon } from './statIcons';

function HorseCard({
  horse,
  density: densityProp,
  variant,
  showNFT = false,
  showRevealAnimation = false,
  showValidation = false,
  showSelectBadge = false,
  showPerformance = true,
  onClick,
  onNFTClick,
  selected = false,
  disabled = false,
  disabledReason,
  className = '',
}: HorseCardProps) {
  const router = useRouter();

  let finalDensity = densityProp || 'detailed';
  let finalShowRevealAnimation = showRevealAnimation;
  let finalShowValidation = showValidation;
  let finalShowSelectBadge = showSelectBadge;

  if (variant) {
    switch (variant) {
      case 'minimal':
        finalDensity = 'minimal';
        break;
      case 'compact':
        finalDensity = 'compact';
        break;
      case 'selectable':
        finalDensity = 'comfortable';
        finalShowValidation = true;
        finalShowSelectBadge = true;
        break;
      case 'reveal':
        finalDensity = 'comfortable';
        finalShowRevealAnimation = true;
        break;
      case 'default':
      default:
        finalDensity = 'detailed';
        break;
    }
  }

  const config = DENSITY_CONFIG[finalDensity];
  const level = (horse.stats?.level ?? 1) as 1 | 2 | 3;
  const levelStyle = LEVEL_CONFIG[level];

  const handleClick = () => {
    if (disabled) return;
    if (onClick) {
      onClick();
    } else if (finalDensity === 'detailed') {
      router.push(`/horse/${horse.id}`);
    }
  };

  const handleNFTClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onNFTClick) {
      onNFTClick();
    } else if (horse.nft_mint_address) {
      window.open(
        `https://explorer.solana.com/address/${horse.nft_mint_address}?cluster=devnet`,
        '_blank'
      );
    }
  };

  const statsToShow = config.stats.map((statKey) => {
    const statMeta = STAT_META[statKey];
    let value = 0;

    if (statKey === 'age') {
      value = horse.age;
    } else if (horse.stats) {
      value = (horse.stats as any)[statKey] ?? 0;
    }

    return {
      key: statKey,
      name: statKey.charAt(0).toUpperCase() + statKey.slice(1).replace('_', ' '),
      value,
      icon: getStatIcon(statMeta.iconName),
      color: statMeta.color,
      max: statMeta.max,
      min: statMeta.min,
      unit: statMeta.unit,
      description: statMeta.description,
    };
  });

  const speedScore = parseInt(String(horse.stats?.speed_score ?? 50));

  if (finalDensity === 'minimal') {
    return (
      <div className={`flex items-center gap-4 ${className}`}>
        <HorseAvatar color={horse.color} size="small" showAnimation={false} />
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-bold text-white truncate">
            {horse.name || 'Unnamed Horse'}
          </h2>
          <p className="text-sm text-gray-400">Age: {horse.age} years</p>
        </div>
      </div>
    );
  }

  const baseAnimationProps = finalShowRevealAnimation
    ? {
        initial: { opacity: 0, scale: 0.8, rotateY: -180 },
        animate: { opacity: 1, scale: 1, rotateY: 0 },
        transition: { duration: 0.8, type: 'spring' },
      }
    : {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
      };

  const hoverProps = config.showHoverEffects && !disabled
    ? {
        whileHover: { scale: 1.02, y: -5 },
        whileTap: { scale: 0.98 },
      }
    : {};

  return (
    <motion.div
      onClick={handleClick}
      {...baseAnimationProps}
      {...hoverProps}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={`block ${disabled ? 'cursor-not-allowed' : onClick || finalDensity === 'detailed' ? 'cursor-pointer' : ''} ${className}`}
    >
      <div
        data-variant={finalDensity}
        className={`glass relative overflow-hidden rounded-2xl ${config.cardPadding} border ${
          finalDensity === 'detailed' ? `${levelStyle.border} ${levelStyle.glow}` : 'border-white/10'
        } ${
          finalShowValidation && disabled
            ? 'border-red-500/30 opacity-75'
            : selected
            ? 'border-neon-green/70 shadow-neon-green'
            : ''
        } group h-full flex flex-col transition-all`}
      >
        {finalShowRevealAnimation && (
          <motion.div
            className="absolute inset-0 opacity-20 blur-3xl"
            style={{ backgroundColor: horse.color }}
            animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
            transition={{ duration: 3, repeat: Infinity }}
          />
        )}

        {!finalShowRevealAnimation && config.showHoverEffects && (
          <motion.div
            className="absolute -top-16 -right-16 w-40 h-40 rounded-full blur-3xl opacity-20"
            style={{ backgroundColor: horse.color }}
            whileHover={{ scale: 1.3, opacity: 0.4 }}
            transition={{ duration: 0.5 }}
          />
        )}

        {finalDensity === 'detailed' && (
          <motion.div
            initial={{ opacity: 0 }}
            whileHover={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="absolute top-4 left-4"
          >
            <motion.div
              animate={{ rotate: [0, 5, -5, 0], scale: [1, 1.2, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <TbSparkles className="text-neon-yellow text-xl" />
            </motion.div>
          </motion.div>
        )}

        <HorseLevelBadge level={level} variant={finalShowRevealAnimation ? 'large' : 'small'} />

        {showNFT && horse.nft_mint_address && (
          <button
            onClick={handleNFTClick}
            className="absolute top-2 left-2 z-20 glass px-2 py-1 rounded-lg text-xs font-bold text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1"
          >
            <TbSparkles className="text-sm" />
            View NFT
          </button>
        )}

        {finalShowSelectBadge && selected && (
          <div className="absolute top-2 right-14 bg-neon-green text-dark-900 px-3 py-1 rounded-full text-xs font-bold z-20">
            SELECTED
          </div>
        )}

        <div className="relative z-10">
          {finalShowRevealAnimation ? (
            <div className="text-center mb-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
                className="mb-4"
              >
                <div
                  className="text-8xl leading-none inline-block"
                  style={{
                    color: horse.color,
                    filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.5))',
                    fontFamily: "'Muybridge', 'Apple Color Emoji', 'Segoe UI Emoji', sans-serif",
                  }}
                >
                  🐎
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <h2 className="text-4xl font-bold mb-6">{horse.name || 'Unnamed Horse'}</h2>

                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div className="glass rounded-lg p-3">
                    <div className="text-xs text-gray-400 mb-1">Speed Score</div>
                    <div className={`text-2xl font-bold ${levelStyle.text}`}>{speedScore}</div>
                  </div>
                  <div className="glass rounded-lg p-3">
                    <div className="text-xs text-gray-400 mb-1">Age</div>
                    <div className="text-2xl font-bold text-white">{horse.age}y</div>
                  </div>
                </div>
              </motion.div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-4 mb-4">
                <HorseAvatar
                  color={horse.color}
                  size={config.avatarSize}
                  showAnimation={config.showHoverEffects}
                />
                <div className="flex-1 min-w-0">
                  <h3 className={`font-bold mb-1 ${finalDensity === 'detailed' ? 'text-2xl' : 'text-lg'} truncate`}>
                    {horse.name || 'Unnamed Horse'}
                  </h3>
                  {finalDensity !== 'compact' && (
                    <div className="flex items-center gap-2 text-gray-400 text-sm">
                      <motion.div
                        animate={finalDensity === 'detailed' ? { rotate: 360 } : {}}
                        transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                      >
                        <MdStars className="text-neon-yellow" />
                      </motion.div>
                      <span>
                        Speed Score: <span className={levelStyle.text}>{speedScore}</span>
                      </span>
                    </div>
                  )}
                  {finalDensity === 'compact' && (
                    <p className="text-xs text-gray-400">Level {level}</p>
                  )}
                </div>
              </div>

              {statsToShow.length > 0 && (
                <div className="space-y-2 mb-4">
                  {statsToShow.map((stat) => (
                    <HorseStatBar
                      key={stat.key}
                      name={stat.name}
                      value={stat.value}
                      max={stat.max}
                      min={stat.min}
                      unit={stat.unit}
                      icon={stat.icon}
                      color={stat.color}
                      showProgressBar={config.showProgressBars}
                      description={stat.description}
                    />
                  ))}
                </div>
              )}

              {showPerformance && horse.statistics && (
                <div className="mb-3 glass rounded-lg p-3 border border-purple-500/20">
                  {horse.statistics.total_races > 0 ? (
                    <>
                      <div className="text-xs text-gray-400 mb-2">Performance</div>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <div className="text-gray-500">Races</div>
                          <div className="font-bold text-white">{horse.statistics.total_races}</div>
                        </div>
                        <div>
                          <div className="text-gray-500">Wins</div>
                          <div className="font-bold text-green-400">{horse.statistics.total_wins}</div>
                        </div>
                        <div>
                          <div className="text-gray-500">Earned</div>
                          <div className="font-bold text-purple-400">
                            {horse.statistics.total_earnings.toFixed(2)} SOL
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-full py-2">
                      <div className="text-xs text-gray-500 text-center">
                        <div className="mb-1">No race history yet</div>
                        <div className="text-[10px]">Enter your first race!</div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {finalShowValidation && disabled && disabledReason && (
                <div className="mb-3 bg-red-500/20 border border-red-500/50 rounded-lg p-2 flex items-center gap-2">
                  <FaExclamationTriangle className="text-red-400" />
                  <span className="text-red-400 text-xs font-semibold">{disabledReason}</span>
                </div>
              )}
            </>
          )}
        </div>

        {horse.in_race && finalDensity === 'detailed' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative overflow-hidden bg-gradient-to-r from-neon-yellow to-neon-orange text-dark-900 font-bold text-center py-3 rounded-xl flex items-center justify-center gap-2 shadow-neon-lg mt-auto"
          >
            <motion.div
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 0.6, repeat: Infinity }}
            >
              <FaFlag className="text-xl" />
            </motion.div>
            <motion.span
              animate={{ opacity: [1, 0.8, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="text-lg"
            >
              Racing Now!
            </motion.span>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

export default memo(HorseCard, (prevProps, nextProps) => {
  return (
    prevProps.horse.id === nextProps.horse.id &&
    prevProps.horse.in_race === nextProps.horse.in_race &&
    prevProps.density === nextProps.density &&
    prevProps.variant === nextProps.variant &&
    prevProps.selected === nextProps.selected &&
    prevProps.disabled === nextProps.disabled &&
    prevProps.showRevealAnimation === nextProps.showRevealAnimation
  );
});
