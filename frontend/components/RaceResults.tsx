'use client';

import { GiPodiumWinner, GiHorseHead, GiTrophy, GiHorseshoe } from 'react-icons/gi';
import { FaClock, FaCoins } from 'react-icons/fa';
import gameConfig, { getRaceEntryFee } from '@/lib/game-config';

interface RaceResultItem {
  horse_id: string;
  horse_name: string;
  owner_name?: string;
  finish_time_ms?: number;
  reward_amount?: number;
  color?: string;
  position?: number;
  finish_position?: number;
  goodluck_used?: boolean;
}

interface RaceResultsProps {
  results: RaceResultItem[];
  title: string;
  subtitle: string;
  isLive?: boolean;
  level?: number;
}

export default function RaceResults({ results, title, subtitle, isLive = false, level = 1 }: RaceResultsProps) {
  const resultsNew: RaceResultItem[] = JSON.parse(JSON.stringify(results)).sort((a: RaceResultItem, b: RaceResultItem) => (a.finish_position || 0) - (b.finish_position || 0));
  const racePrice = getRaceEntryFee(level);
  const playersCount = results.length;
  const is1v1 = playersCount === 2;
  const totalReward = racePrice * playersCount;
  const rewardDistributionRates = Object.values(is1v1 ? gameConfig.race.reward_distribution_1v1 : gameConfig.race.reward_distribution);

  const colors = [
    'from-yellow-600 to-yellow-700',
    'from-blue-400 to-blue-500',
    'from-green-600 to-green-700',
    'from-gray-600 to-gray-700',
    'from-gray-700 to-gray-800',
    'from-gray-700 to-gray-800',
    'from-gray-700 to-gray-800',
    'from-gray-700 to-gray-800',
  ];

  const medalIcons = [
    <GiTrophy key="1st" className="text-3xl text-yellow-300" />,
    <GiTrophy key="2nd" className="text-3xl text-gray-300" />,
    <GiTrophy key="3rd" className="text-3xl text-orange-400" />,
  ];

  return (
    <div className={`bg-gradient-to-br from-gray-800 via-gray-850 to-gray-800 border border-gray-700 rounded-xl p-6 shadow-lg ${isLive ? 'mb-6' : ''}`}>
      <div className="flex items-center gap-3 mb-6">
        <GiPodiumWinner className={`text-4xl ${isLive ? 'text-green-400 animate-pulse' : 'text-yellow-400'}`} />
        <div>
          <h2 className="text-2xl font-bold">{title}</h2>
          <p className="text-gray-400 text-sm">{subtitle}</p>
        </div>
      </div>
      <div className="space-y-3">
        {resultsNew.map((result, index) => {
          const displayPosition = result.position !== undefined ? result.position : index + 1;
          const positionIndex = (displayPosition || 1) - 1;

          return (
            <div
              key={result.horse_id}
              className={`bg-gradient-to-r ${colors[positionIndex] || 'from-gray-700 to-gray-800'} rounded-xl shadow-md hover:shadow-lg transition-all border border-gray-600/50 ${isLive ? 'animate-[fadeIn_0.5s_ease-in]' : ''}`}
            >
              <div className="flex justify-between items-center p-5 bg-[rgba(0,0,0,0.3)] rounded-xl">
                <div className="flex-1">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-12 h-12 bg-[rgba(0,0,0,0.3)] rounded-full">
                      {positionIndex < 3 ? medalIcons[positionIndex] : (
                        <span className="font-bold text-2xl">#{displayPosition}</span>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 font-semibold text-xl">
                        <GiHorseHead style={{ color: result.color }} />
                        {result.horse_name}
                        {result.goodluck_used && (
                          <span className="text-lg" title="GoodLuck Active"><GiHorseshoe className='w-4 h-4' /></span>
                        )}
                      </div>
                      <div className="text-sm opacity-90 flex items-center gap-1 mt-1">
                        <span>Owner:</span>
                        <span className="font-medium">{result.owner_name ? result.owner_name.slice(0, 6) + '...' : 'Unknown'}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  {isLive ? (
                    <div className="text-lg font-bold text-green-400">
                      🏁 FINISHED
                    </div>
                  ) : (
                    <>
                      {result.finish_time_ms && (
                        <div className="flex items-center gap-2 text-sm opacity-75 justify-end mb-1">
                          <FaClock />
                          {(result.finish_time_ms / 1000).toFixed(2)}s
                        </div>
                      )}
                      {/* {result.reward_amount !== undefined && result.reward_amount > 0 ? (
                      <div className="text-xl font-bold text-yellow-300 flex items-center gap-1 justify-end">
                        <FaCoins />
                        +{result.reward_amount.toFixed(3)} SOL
                      </div>
                    ) : result.reward_amount === 0 ? (
                      <div className="text-sm text-gray-400 italic justify-end flex">
                        No reward
                      </div>
                    ) : null} */}
                      {rewardDistributionRates[index] ?
                        <div className="text-xl font-bold text-yellow-300 flex items-center gap-1 justify-end">
                          <FaCoins className='mr-2' />
                          +{rewardDistributionRates[index] * totalReward} SOL
                        </div> :
                        <div className="text-sm text-gray-400 italic justify-end flex">
                          {(is1v1 && index == 1 || index == 3) ?
                            <div className="flex items-center gap-1 text-neon-green text-lg"><GiHorseshoe className="w-5 h-5" /> Goodluck Gift</div> :
                            "No reward"
                          }
                        </div>
                      }
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
