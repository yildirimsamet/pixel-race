'use client';

import { useState, useMemo, useCallback } from 'react';
import { Horse } from '@/types';
import HorseCard from '@/components/HorseCard';
import { IoEnter, IoChevronDown, IoChevronUp, IoInformationCircle, IoClose } from 'react-icons/io5';

interface JoinRaceSectionProps {
  horses: Horse[];
  raceLevel: number;
  joining: boolean;
  onJoin: (horseId: string) => void;
  entryFee?: number;
  raceStartTime?: string | null;
}

export default function JoinRaceSection({ horses, raceLevel, joining, onJoin, entryFee = 0, raceStartTime = null }: JoinRaceSectionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [pendingHorseId, setPendingHorseId] = useState<string | null>(null);

  const eligibleHorses = useMemo(() =>
    horses.filter(horse => horse.stats?.level === raceLevel),
    [horses, raceLevel]
  );


  const isRaceStartingSoon = useCallback((): boolean => {
    if (!raceStartTime) return false;
    const startTime = new Date(raceStartTime).getTime();
    const now = Date.now();
    const timeUntilStart = startTime - now;
    return timeUntilStart <= 10000 && timeUntilStart > 0;
  }, [raceStartTime]);

  const canJoinRace = useCallback((horse: Horse): { canJoin: boolean; reason?: string } => {
    if (isRaceStartingSoon()) {
      return { canJoin: false, reason: 'Race starting soon!' };
    }
    if (!horse.stats) return { canJoin: true };

    const energy = horse.stats.energy;
    if (energy < 20) {
      return { canJoin: false, reason: 'Too tired! Rest needed.' };
    }

    const satiety = horse.stats.satiety;
    if (satiety < 10) {
      return { canJoin: false, reason: 'Too hungry! Feed first.' };
    }

    return { canJoin: true };
  }, [isRaceStartingSoon]);

  const handleJoinClick = useCallback((horseId: string) => {
    setPendingHorseId(horseId);
    setShowWarningModal(true);
  }, []);

  const handleConfirmJoin = useCallback(() => {
    setShowWarningModal(false);
    if (pendingHorseId) {
      onJoin(pendingHorseId);
      setPendingHorseId(null);
    }
  }, [pendingHorseId, onJoin]);

  const handleCancelJoin = useCallback(() => {
    setShowWarningModal(false);
    setPendingHorseId(null);
  }, []);

  return (
    <div className="space-y-4">
      {showWarningModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={handleCancelJoin} />

          <div className="relative glass rounded-2xl border border-amber-500/50 shadow-2xl max-w-md w-full p-6 animate-scale-in">
            <button
              onClick={handleCancelJoin}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
            >
              <IoClose className="text-2xl" />
            </button>

            <div className="flex items-start gap-4 mb-6">
              <div className="p-3 rounded-xl bg-amber-500/20 border border-amber-500/30">
                <IoInformationCircle className="text-amber-400 text-3xl" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-amber-400 mb-2">Race Impact Warning</h3>
                <p className="text-gray-300 text-sm leading-relaxed">
                  After the race, your horse's <span className="text-green-400 font-semibold">energy</span> and{' '}
                  <span className="text-orange-400 font-semibold">satiety</span> will decrease by{' '}
                  <span className="text-white font-bold">10 points</span> each.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleCancelJoin}
                className="flex-1 py-3 px-4 rounded-xl bg-gray-700/50 hover:bg-gray-600/50 border border-gray-600/50 text-white font-semibold transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmJoin}
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-neon-green to-green-600 hover:from-neon-green hover:to-neon-blue text-white font-bold transition-all shadow-lg shadow-neon-green/30 hover:shadow-neon-green/50"
              >
                Join Race
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="glass rounded-3xl border border-neon-green/30 shadow-neon-green animate-slide-up overflow-hidden">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full p-8 flex items-center justify-between hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-4">
            <IoEnter className="text-4xl text-neon-green animate-float" />
            <div className="text-left">
              <h2 className="text-2xl sm:text-3xl font-bold">Enter Your Horse</h2>
              <p className="text-gray-400 text-sm">Choose a champion to compete in this race</p>
            </div>
          </div>
          <div className="text-3xl text-neon-green">
            {isOpen ? <IoChevronUp /> : <IoChevronDown />}
          </div>
        </button>

      <div className={`transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
        <div className="px-8 pb-8">

      {entryFee > 0 && (
        <div className="mb-6 glass rounded-xl p-4 border border-purple-500/30">
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Entry Fee (SOL):</span>
            <span className="text-2xl font-bold text-purple-400">{entryFee} SOL</span>
          </div>
          <p className="text-xs text-gray-500 mt-2">Payment will be requested from your wallet when joining</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {eligibleHorses.map(horse => {
          const { canJoin, reason } = canJoinRace(horse);

          return (
            <div key={horse.id} className="relative">
              <HorseCard
                horse={horse}
                density="comfortable"
                showValidation={true}
                showSelectBadge={false}
                showPerformance={false}
                disabled={!canJoin || joining}
                disabledReason={reason}
                onClick={() => handleJoinClick(horse.id)}
              />
              <button
                onClick={() => handleJoinClick(horse.id)}
                disabled={joining || !canJoin}
                className={`btn-neon w-full mt-3 py-3 rounded-xl transition-all font-bold flex items-center justify-center gap-2 ${
                  canJoin
                    ? 'bg-gradient-to-r from-neon-green to-green-600 hover:from-neon-green hover:to-neon-blue'
                    : 'bg-gray-600 cursor-not-allowed opacity-50'
                }`}
              >
                <IoEnter className="text-xl" />
                {canJoin ? 'Join Race' : 'Cannot Join'}
              </button>
            </div>
          );
        })}
      </div>
        </div>
      </div>
      </div>
    </div>
  );
}
