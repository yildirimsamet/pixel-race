'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import { races as racesApi, horses as horsesApi, users, goodluck } from '@/lib/api';
import { Race, Horse, User, RaceResult } from '@/types';
import RaceCanvas from '@/components/RaceCanvas'; import HeroHeader from '@/components/HeroHeader';
import RaceStatsGrid from '@/components/RaceStatsGrid';
import RaceResults from '@/components/RaceResults';
import JoinRaceSection from '@/components/JoinRaceSection';
import { useRaceSocket } from '@/hooks/useRaceSocket';
import { useCountdown } from '@/hooks/useCountdown';
import { GiHorseshoe, GiTrophy } from 'react-icons/gi';
import { MdCancel } from 'react-icons/md';
import { FaFlagCheckered } from 'react-icons/fa';
import Loader from '@/components/Loader';
import Countdown from '@/components/Countdown';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { createRaceEntryTransaction } from '@/lib/solana-transactions';
import { useTransaction } from '@/hooks/useTransaction';
import { formatSOLWithSymbol } from '@/lib/solana-fees';
import BalanceWarning from '@/components/BalanceWarning';
import { toast } from '@/lib/toast';
import RaceReplay from '@/components/RaceReplay';
import RaceEndStatsModal from '@/components/RaceEndStatsModal';
import LoginPrompt from '@/components/LoginPrompt';
import RewardModal from '@/components/RewardModal';
import ChatBox from '@/components/ChatBox';

export default function RacePage() {
  const params = useParams();
  const raceId = params.id as string;

  const [race, setRace] = useState<Race | null>(null);
  const [myHorses, setMyHorses] = useState<Horse[]>([]);
  const [results, setResults] = useState<RaceResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [myHorseIds, setMyHorseIds] = useState<string[]>([]);
  const [showBottomResults, setShowBottomResults] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [joiningHorseId, setJoiningHorseId] = useState<string | null>(null);
  const [showBalanceWarning, setShowBalanceWarning] = useState(false);
  const [currentBalance, setCurrentBalance] = useState<number>(0);
  const [showReplayModal, setShowReplayModal] = useState(false);
  const [activatingGoodLuck, setActivatingGoodLuck] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [statsRaceId, setStatsRaceId] = useState<string | null>(null);
  const [showConsolationModal, setShowConsolationModal] = useState(false);
  const [consolationData, setConsolationData] = useState<{
    horseName: string;
    position: number;
    is1v1: boolean;
  } | null>(null);

  const pollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const lastToastTime = useRef<number>(0);
  const TOAST_THROTTLE_MS = 2000;

  const { publicKey, connected } = useWallet();
  const { connection } = useConnection();
  const { sendSolTransaction, estimateFee, checkBalance, loading: txLoading, status, estimatedFee } = useTransaction();

  const loadRaceData = useCallback(async () => {
    try {
      const raceData = await racesApi.getAll();

      const [horsesData, userData] = connected
        ? await Promise.all([
          horsesApi.getAll().catch(() => []),
          users.getMe().catch(() => null)
        ])
        : [[], null];

      const currentRace = raceData.find((r: Race) => r.id === raceId);
      if (currentRace) {
        setRace(prevRace => {
          if (prevRace?.status === 'done' && currentRace.status === 'racing') {
            return { ...currentRace, status: 'done' };
          }
          if (prevRace?.status === 'cancelled' && currentRace.status === 'waiting') {
            return { ...currentRace, status: 'cancelled' };
          }
          return currentRace;
        });

        if (currentRace.status === 'waiting' || currentRace.status === 'racing' || currentRace.status === 'done' || currentRace.status === 'cancelled') {
          const resultsData = await racesApi.getResults(raceId);
          setResults(resultsData);
        }
      }

      setUser(userData);

      const horsesWithStats = await Promise.all(
        horsesData.map(async (horse) => {
          try {
            const statsData = await horsesApi.getStats(horse.id);
            return {
              ...horse,
              stats: statsData.dynamic_stats || null,
              statistics: statsData.performance ? {
                total_races: statsData.performance.total_races,
                total_wins: statsData.performance.total_wins,
                total_earnings: statsData.performance.total_earnings
              } : null
            };
          } catch {
            return horse;
          }
        })
      );

      setMyHorses(horsesWithStats.filter((h) => !h.in_race));
      setMyHorseIds(horsesWithStats.map((h) => h.id));
    } catch (error: any) {
      toast.error('Failed to load race data');
      console.error('Failed to load race data:', error);
    } finally {
      setLoading(false);
    }
  }, [raceId, connected]);

  const handleRaceEnd = useCallback(async () => {
    if (pollTimeoutRef.current) {
      clearTimeout(pollTimeoutRef.current);
      pollTimeoutRef.current = null;
    }

    let retries = 0;
    const maxRetries = 10;
    const pollInterval = 500;

    const pollResults = async () => {
      try {
        const resultsData = await racesApi.getResults(raceId);
        const rewardsCalculated = resultsData.some((r: any) => r.reward_amount !== undefined && r.reward_amount !== null);

        if (rewardsCalculated || retries >= maxRetries) {
          setRace(prev => prev ? { ...prev, status: 'done' } : null);
          setResults(resultsData);
          setShowBottomResults(true);
          await loadRaceData();

          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('raceEndRewardCheck'));
          }

          let userHasHorseInRace = false;
          try {
            if (connected) {
              const currentUser = await users.getMe();
              const userHorses = await horsesApi.getAll();
              const userHorseIds = userHorses.map((h: Horse) => h.id);

              userHasHorseInRace = resultsData.some((result: any) =>
                userHorseIds.includes(result.horse_id)
              );
            }
          } catch (error) {
            console.error('Failed to check user horse ownership:', error);
            userHasHorseInRace = resultsData.some((result: any) =>
              myHorseIds.includes(result.horse_id)
            );
          }

          if (userHasHorseInRace) {
            setTimeout(() => {
              setStatsRaceId(raceId);
              setShowStatsModal(true);
            }, 2000);
          } else {
          }
        } else {
          retries++;
          pollTimeoutRef.current = setTimeout(pollResults, pollInterval);
        }
      } catch (error) {
        console.error('Failed to fetch results:', error);
        retries++;
        if (retries < maxRetries) {
          pollTimeoutRef.current = setTimeout(pollResults, pollInterval);
        }
      }
    };

    pollResults();
  }, [loadRaceData, raceId, connected]);

  const handleRaceStart = useCallback(async () => {
    setRace(prev => prev ? { ...prev, status: 'racing' } : null);
    await loadRaceData();
  }, [loadRaceData]);

  const handleRaceCancelled = useCallback(async () => {
    setRace(prev => prev ? { ...prev, status: 'cancelled' } : null);
    toast.warning('Race cancelled - insufficient participants');
    await loadRaceData();
  }, [loadRaceData]);

  const handleGoodLuckUsed = useCallback(async () => {
    try {
      const updatedResults = await racesApi.getResults(raceId);
      setResults(updatedResults);
    } catch (error) {
      console.error('Failed to fetch updated race results after GoodLuck usage:', error);
    }
  }, [raceId]);

  const handleConsolationReward = useCallback((data: {
    race_id: string;
    user_id: string;
    horse_name: string;
    finish_position: number;
    reward_type: string;
    reward_amount: number;
  }) => {

    const currentUserId = user?.id?.toString();
    const rewardUserId = data.user_id?.toString();

    if (currentUserId && rewardUserId && currentUserId === rewardUserId) {
      const is1v1 = race?.max_horses === 2;
      setConsolationData({
        horseName: data.horse_name,
        position: data.finish_position,
        is1v1: is1v1
      });
      setShowConsolationModal(true);

      toast.success(`🐴 You earned a GoodLuck Charm with ${data.horse_name}!`, {
        icon: <GiHorseshoe className='w-5 h-5' />
      });
    } else {
    }
  }, [user, race]);

  const handleRegistration = useCallback(async (data: any) => {
    setRace(prev => {
      if (prev) {
        return { ...prev, registered_horses: data.registered_count };
      }
      return prev;
    });

    const now = Date.now();
    if (now - lastToastTime.current > TOAST_THROTTLE_MS) {
      toast.success(`🐴 ${data.horse_name} joined the race! (${data.registered_count}/${data.max_horses})`);
      lastToastTime.current = now;
    }

    try {
      const updatedResults = await racesApi.getResults(raceId);
      setResults(updatedResults);
    } catch (error) {
      console.error('Failed to fetch updated race results:', error);
      loadRaceData();
    }
  }, [raceId, loadRaceData]);

  const { horsesProgress, liveFinishOrder, registeredCount } = useRaceSocket(
    raceId,
    handleRaceEnd,
    handleRaceStart,
    handleRegistration,
    handleRaceCancelled,
    handleGoodLuckUsed,
    handleConsolationReward
  );
  const { timeUntilStart, isLineup, coundownDone } = useCountdown(race?.start_time, race?.status || '');

  useEffect(() => {
    loadRaceData();
  }, [raceId, loadRaceData]);

  useEffect(() => {
    return () => {
      if (pollTimeoutRef.current) {
        clearTimeout(pollTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const fetchBalance = async () => {
      if (connected && publicKey) {
        try {
          const balanceLamports = await connection.getBalance(publicKey);
          const balanceSol = balanceLamports / 1_000_000_000;

          if (currentBalance !== balanceSol) {
            setCurrentBalance(balanceSol);
          }

        } catch (error) {
          console.error('Failed to fetch balance:', error);
        }
      }
    };

    fetchBalance();
    const interval = setInterval(fetchBalance, 30000);
    return () => clearInterval(interval);
  }, [connected, publicKey, connection]);

  const handleJoinRace = useCallback(async (horseId: string) => {
    if (!connected || !publicKey) {
      toast.warning('Please connect your wallet first');
      return;
    }

    if (!race) {
      toast.error('Race not found');
      return;
    }

    if (race.status !== 'waiting') {
      toast.error('Race has already started or finished');
      return;
    }

    const currentRegisteredCount = registeredCount !== null ? registeredCount : race.registered_horses;
    if (currentRegisteredCount >= race.max_horses) {
      toast.error('Race is full');
      return;
    }

    const selectedHorse = myHorses.find(h => h.id === horseId);
    if (selectedHorse?.in_race) {
      toast.error('This horse is already in a race');
      return;
    }

    const treasuryAddress = process.env.NEXT_PUBLIC_TREASURY_WALLET;
    if (!treasuryAddress) {
      toast.error('Treasury wallet not configured');
      return;
    }

    setJoiningHorseId(horseId);
    setShowBalanceWarning(false);

    try {
      toast.info('Validating race entry...');

      const validation = await racesApi.canJoinRace(raceId, horseId);

      if (!validation.can_join) {
        const errorMessage = validation.error || validation.message || 'Cannot join race at this time';
        toast.error(errorMessage);
        setJoiningHorseId(null);
        return;
      }

      const transaction = await createRaceEntryTransaction(
        publicKey,
        treasuryAddress,
        race.entry_fee
      );

      const feeEstimate = await estimateFee(transaction);

      const hasSufficientBalance = await checkBalance(race.entry_fee, true);

      if (!hasSufficientBalance) {
        setShowBalanceWarning(true);
        toast.warning(`Insufficient balance! Total required: ${formatSOLWithSymbol(race.entry_fee + feeEstimate)}`);
        setJoiningHorseId(null);
        return;
      }

      toast.info(`Entry fee: ${formatSOLWithSymbol(race.entry_fee)} fee`);

      const txSignature = await sendSolTransaction(
        transaction,
        async (sig) => {
          toast.info('Entry fee paid! Joining race...');

          try {
            await racesApi.join(raceId, horseId, sig);
            toast.success('Successfully joined race! Check notifications for details.', {
              autoClose: 6000,
            });

            await loadRaceData();
            setJoiningHorseId(null);
            setShowBalanceWarning(false);
          } catch (error: any) {
            console.error('Failed to join race:', error);
            toast.error(`Entry fee paid but failed to join race: ${error.response?.data?.detail || error.message}`, {
              autoClose: 8000,
            });
            setJoiningHorseId(null);
          }
        },
        (error) => {
          console.error('Transaction failed:', error);
          setJoiningHorseId(null);
        }
      );

      if (!txSignature) {
        toast.info('Transaction was not completed');
        setJoiningHorseId(null);
      }
    } catch (error: any) {
      console.error('Join race error:', error);
      setJoiningHorseId(null);
    }
  }, [raceId, race, loadRaceData, connected, publicKey, sendSolTransaction, estimateFee, checkBalance]);

  const handleActivateGoodLuck = useCallback(async (horseId: string) => {
    if (!user) {
      toast.error('User not found');
      return;
    }

    if (user.goodluck_count <= 0) {
      toast.error('You have no GoodLuck tokens. Visit /goodluck to purchase.');
      return;
    }

    setActivatingGoodLuck(true);

    try {
      const response = await goodluck.useOnRace(raceId, { horse_id: horseId });
      toast.success(response.message);

      await loadRaceData();
    } catch (error: any) {
      const errorMessage = error?.response?.data?.detail || error?.message || 'Failed to activate GoodLuck';
      toast.error(errorMessage);
      console.error('GoodLuck activation error:', error);
    } finally {
      setActivatingGoodLuck(false);
    }
  }, [user, raceId, loadRaceData]);

  if (loading) {
    return (
      <div className="text-center animate-fade-in w-full h-[calc(100vh-150px)] mt-auto flex items-center justify-center">
        <Loader text="Loading Race..." />
      </div>
    );
  }

  if (!race) {
    return (
      <div className="glass text-center py-16 rounded-2xl border border-red-500/30 animate-fade-in">
        <MdCancel className="text-7xl mx-auto mb-4 text-red-500" />
        <p className="text-2xl font-bold mb-2">Race Not Found</p>
        <p className="text-gray-400">This race doesn't exist or has been removed</p>
      </div>
    );
  }

  const levelColors = {
    1: { text: 'text-neon-green', bg: 'bg-neon-green', border: 'border-neon-green', shadow: 'shadow-neon-green' },
    2: { text: 'text-neon-blue', bg: 'bg-neon-blue', border: 'border-neon-blue', shadow: 'shadow-neon' },
    3: { text: 'text-neon-purple', bg: 'bg-neon-purple', border: 'border-neon-purple', shadow: 'shadow-neon-purple' },
  };
  const levelStyle = levelColors[race.level_requirement as keyof typeof levelColors] || levelColors[1];

  return (
    <div className="space-y-8 animate-fade-in">
      <HeroHeader
        icon={<GiTrophy className="animate-float" />}
        title={
          <div className="flex items-center gap-3">
            <span className={levelStyle.text}>Level {race.level_requirement}</span> Championship
            {race.max_horses === 2 && (
              <span className="bg-gradient-to-r from-orange-600 to-red-600 px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wide shadow-lg border border-orange-400/50 animate-pulse-slow">
                1v1
              </span>
            )}
          </div>
        }
        subtitle="Real-time race arena • Live updates"
        borderColor={`${levelStyle.border}/30`}
        shadowColor={levelStyle.shadow}
        iconColor={levelStyle.text}
      />

      <RaceStatsGrid race={race} timeUntilStart={timeUntilStart} isLineup={isLineup} />

      {race.status === 'waiting' && !isLineup && !coundownDone && (
        <div className="glass rounded-3xl py-8 px-4 border border-neon-yellow/30 shadow-neon fixed top-0 left-1/2 -translate-x-1/2 z-50">
          <p className="text-center text-gray-400 mb-6 uppercase tracking-wide text-base font-bold">Race Starts In</p>
          <Countdown targetTime={race.start_time} fromRacePage />
        </div>
      )}

      {showBalanceWarning && race && estimatedFee !== null && (
        <BalanceWarning
          currentBalance={currentBalance}
          requiredAmount={race.entry_fee}
          estimatedFee={estimatedFee}
          network={process.env.NEXT_PUBLIC_SOLANA_NETWORK}
        />
      )}

      {/* {status !== 'idle' && txLoading && (
        <div className="glass rounded-xl p-4 border border-neon-blue/50 bg-neon-blue/5">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-neon-blue"></div>
            <div className="text-sm">
              {status === 'estimating' && <span className="text-gray-300">Estimating fee...</span>}
              {status === 'pending' && <span className="text-neon-blue font-semibold">Sending transaction...</span>}
              {status === 'confirming' && <span className="text-neon-yellow font-semibold">Confirming transaction...</span>}
            </div>
          </div>
        </div>
      )} */}

      {race.status === 'waiting' && (() => {
        if (!connected) {
          return (
            <LoginPrompt
              title="Connect Wallet to Join Race"
              message={`Entry fee: ${formatSOLWithSymbol(race.entry_fee)} • Win prizes by finishing in top 3`}
              buttonText="Connect Wallet to Race"
              icon={<GiTrophy className="text-8xl text-neon-yellow mx-auto mb-4 animate-float" />}
              className="max-w-2xl mx-auto"
            />
          );
        }

        const userHasHorseInRace = results.some(result =>
          myHorseIds.includes(result.horse_id)
        );

        if (!userHasHorseInRace) {
          return (
            <JoinRaceSection
              horses={myHorses}
              raceLevel={race.level_requirement}
              joining={txLoading}
              onJoin={handleJoinRace}
              entryFee={race.entry_fee}
              raceStartTime={race.start_time}
            />
          );
        }

        const userRaceResult = results.find(result => myHorseIds.includes(result.horse_id));
        const isGoodLuckActive = userRaceResult?.goodluck_used || false;
        const userHorseId = userRaceResult?.horse_id;

        return (
          <div className="space-y-4">
            <div className="glass rounded-3xl p-6 border border-neon-green/30 shadow-neon-green">
              <div className="flex items-center gap-4">
                <div className="text-5xl">✅</div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-neon-green mb-1">You're In!</h3>
                  <p className="text-gray-400">Your horse is registered for this race. Good luck!</p>
                </div>
              </div>
            </div>

            {userHorseId && (
              <div className="glass rounded-3xl p-6 border border-emerald-500/30 shadow-neon">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-5xl"><GiHorseshoe className="w-10 h-10" /></span>
                    <div>
                      <h3 className="text-xl font-bold text-emerald-400 mb-1">GoodLuck Boost</h3>
                      <p className="text-gray-400 text-sm">
                        {isGoodLuckActive
                          ? 'Active - Your horse will get only positive buffs!'
                          : 'Activate GoodLuck to get only positive speed variations'}
                      </p>
                      {user && !isGoodLuckActive && (
                        <p className="text-xs text-gray-500 mt-1">
                          Available: {user.goodluck_count} token{user.goodluck_count !== 1 ? 's' : ''}
                        </p>
                      )}
                    </div>
                  </div>

                  {isGoodLuckActive ? (
                    <div className="bg-emerald-600 px-6 py-3 rounded-xl font-bold text-white flex items-center gap-2 opacity-80 cursor-not-allowed">
                      <span className="text-2xl">✅</span>
                      <span>Active</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleActivateGoodLuck(userHorseId)}
                      disabled={activatingGoodLuck || !user || user.goodluck_count <= 0}
                      className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed px-6 py-3 rounded-xl font-bold transition-all duration-300 shadow-neon-green hover:shadow-neon-lg hover:scale-105 disabled:scale-100 flex items-center gap-2"
                    >
                      {activatingGoodLuck ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Activating...</span>
                        </>
                      ) : (
                        <>
                          <span className="text-2xl"><GiHorseshoe className='w-5 h-5' /></span>
                          <span>Use GoodLuck</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
                {!isGoodLuckActive && user && user.goodluck_count <= 0 && (
                  <div className="mt-4 bg-yellow-900/30 border border-yellow-500/30 rounded-lg p-3">
                    <p className="text-yellow-400 text-sm">
                      You don't have any GoodLuck tokens.{' '}
                      <a href="/goodluck" className="underline hover:text-yellow-300">
                        Purchase here
                      </a>
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })()}

      <div className="glass rounded-3xl p-6 border border-neon-purple/30 shadow-neon-purple relative z-20">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex items-center gap-4">
            <FaFlagCheckered className="text-2xl text-neon-green animate-float" />
            <div>
              <h2 className="text-base text-neon-green sm:text-xl font-bold">Race Arena</h2>
            </div>
          </div>

          {race.status === 'racing' && (
            <div className="flex items-center gap-3 bg-neon-red/20 border border-neon-red/50 px-5 py-2.5 rounded-xl shadow-neon-red animate-pulse">
              <span className="relative flex h-4 w-4">
                <span className="pulse-ring absolute inline-flex h-full w-full rounded-full bg-neon-red"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-neon-red"></span>
              </span>
              <span className="text-neon-red font-extrabold text-lg tracking-wide">LIVE NOW</span>
            </div>
          )}
        </div>

        <RaceCanvas
          horses={horsesProgress}
          status={race.status as any}
          userHorseIds={myHorseIds}
          registeredHorses={results as any}
          raceStartTime={race.start_time}
        />
      </div>

      {race.status === 'racing' && liveFinishOrder.length > 0 && (
        <RaceResults
          results={liveFinishOrder.map(f => {
            const r = results.find(res => res.horse_id === f.horse_id);
            return r ? {
              ...r,
              position: f.position,
              reward_amount: undefined
            } : null;
          }).filter((r): r is NonNullable<typeof r> => r !== null) as any}
          title="Live Results"
          subtitle="Horses finishing the race"
          isLive={true}
        />
      )}

      {(race.status === 'done' || showBottomResults) && results.length > 0 && (
        <>
          <div className="glass rounded-3xl p-6 border border-purple-500/30 shadow-neon-purple">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-purple-400 mb-1">Race Replay</h3>
                <p className="text-gray-400 text-sm">Watch the race again with full details</p>
              </div>
              <button
                onClick={() => setShowReplayModal(true)}
                className="btn-neon bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 px-6 py-3 rounded-xl font-bold flex items-center gap-2"
              >
                <span className="text-2xl">🎬</span>
                <span>Watch Replay</span>
              </button>
            </div>
          </div>

          <RaceResults
            results={results as any}
            title="Race Results"
            subtitle="Final standings and rewards"
            level={race.level_requirement}
          />
        </>
      )}

      {showReplayModal && race.status === 'done' && results.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in !m-0">
          <div className="relative w-[95vw] max-w-7xl bg-gray-900 rounded-2xl border-2 border-purple-500 shadow-2xl p-6">
            <button
              onClick={() => setShowReplayModal(false)}
              className="absolute top-2 right-2 z-50 bg-red-600 hover:bg-red-700 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold text-xl"
            >
              ✕
            </button>

            <RaceReplay
              horses={results.map(r => {
                let segments = [];
                try {
                  segments = r.race_segments ? JSON.parse(r.race_segments) : [];
                } catch (error) {
                  segments = [];
                }
                return {
                  horse_id: r.horse_id,
                  horse_name: r.horse_name,
                  color: r.color,
                  owner_name: r.owner_name,
                  segments: segments,
                  finish_time_ms: r.finish_time_ms || 0,
                  finish_position: r.finish_position || 0,
                  created_at: r.created_at || 0,
                  speed_score: (r as any).speed_score || 0,
                  goodluck_used: r.goodluck_used || false,
                };
              }) as any}
              onReplayEnd={() => {
              }}
            />
          </div>
        </div>
      )}

      {statsRaceId && (
        <RaceEndStatsModal
          isOpen={showStatsModal}
          onClose={() => setShowStatsModal(false)}
          raceId={statsRaceId}
        />
      )}

      {consolationData && (
        <RewardModal
          isOpen={showConsolationModal}
          onClose={() => {
            setShowConsolationModal(false);
            setConsolationData(null);
          }}
          reward={{
            id: 'consolation-temp',
            reward_type: 'goodluck',
            claimed: true,
            created_at: new Date().toISOString()
          }}
          showClaimButton={false}
          autoCloseDelay={5000}
          customTitle={`🍀 Consolation Prize - ${consolationData.horseName}!`}
          customDescription={
            consolationData.is1v1
              ? `Great effort! Your horse ${consolationData.horseName} finished in 2nd place in a 1v1 race. You've earned 1 free GoodLuck Charm as a consolation prize!`
              : `Nice try! Your horse ${consolationData.horseName} finished in 4th place. You've earned 1 free GoodLuck Charm as a consolation prize!`
          }
        />
      )}

      <ChatBox raceId={raceId} />
    </div>
  );
}
