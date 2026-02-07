'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import Loader from '@/components/Loader';
import { useWanderingHorses } from '@/hooks/useWanderingHorses';
import { useRaceStartProgress } from '@/hooks/useRaceStartProgress';
import { useFinishOrder } from '@/hooks/useFinishOrder';
import { GiHorseshoe } from 'react-icons/gi';
import RaceStartProgress from '@/components/RaceStartProgress';

interface HorseProgress {
  horse_id: string;
  horse_name: string;
  progress: number;
  finished: boolean;
  color?: string;
  owner_name?: string;
}

interface RegisteredHorse {
  horse_id: string;
  horse_name: string;
  owner_name?: string;
  finish_time_ms?: number;
  finish_position?: number;
  color?: string;
  created_at?: string;
  goodluck_used?: boolean;
}

interface RaceCanvasProps {
  horses: HorseProgress[];
  status: 'waiting' | 'racing' | 'done' | 'cancelled';
  userHorseIds?: string[];
  registeredHorses?: RegisteredHorse[];
  raceStartTime?: string;
}

export default function RaceCanvas({ horses, status, userHorseIds = [], registeredHorses = [], raceStartTime }: RaceCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [fontLoaded, setFontLoaded] = useState(false);

  const wanderingHorses = useWanderingHorses(status, registeredHorses, raceStartTime);
  const raceStartProgress = useRaceStartProgress(status, raceStartTime);
  const finishOrder = useFinishOrder(horses, status);


  useEffect(() => {
    const styleId = 'race-canvas-animations';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        @keyframes countdownPulse {
          0% { transform: scale(1.2); opacity: 1; }
          50% { transform: scale(1); opacity: 0.95; }
          100% { transform: scale(0.9); opacity: 0.9; }
        }
        @keyframes ringExpand {
          0% { transform: scale(0.8) rotate(0deg); opacity: 0; }
          50% { opacity: 1; }
          100% { transform: scale(1.3) rotate(180deg); opacity: 0; }
        }
        @keyframes dustFade {
          0% { opacity: 0.6; transform: translateX(0) scale(1); }
          100% { opacity: 0; transform: translateX(-20px) scale(1.5); }
        }
        @keyframes boostPulse {
          0% { transform: scale(1) translate(-50%, -50%); opacity: 0.8; }
          50% { transform: scale(1.5) translate(-33%, -33%); opacity: 0; }
          100% { transform: scale(1.5) translate(-33%, -33%); opacity: 0; }
        }
        @keyframes bannerSlide {
          0% { transform: translateY(-100px); opacity: 0; }
          50% { transform: translateY(10px); }
          100% { transform: translateY(0); opacity: 1; }
        }
        @keyframes bannerGlow {
          0%, 100% { filter: drop-shadow(0 0 20px rgba(0, 255, 136, 0.8)) drop-shadow(0 0 40px rgba(0, 217, 255, 0.6)); }
          50% { filter: drop-shadow(0 0 40px rgba(0, 255, 136, 1)) drop-shadow(0 0 60px rgba(0, 217, 255, 0.8)); }
        }
        .countdown-number { animation: countdownPulse 1s ease-out; }
        .countdown-ring { animation: ringExpand 1s ease-out; }
        .dust-cloud { animation: dustFade 0.5s ease-out infinite; }
        .boost-ring { animation: boostPulse 1s ease-out infinite; }
        .finish-banner { animation: bannerSlide 0.8s cubic-bezier(0.34, 1.56, 0.64, 1), bannerGlow 2s ease-in-out infinite; }
      `;
      document.head.appendChild(style);
    }
  }, []);

  useEffect(() => {
    const checkFont = async () => {
      try {
        await document.fonts.load('normal 1em Muybridge');

        setTimeout(() => {
          setFontLoaded(true);
        }, 100);
      } catch (error) {
        console.error('[RaceCanvas] Font loading error:', error);
        setTimeout(() => {
          setFontLoaded(true);
        }, 2000);
      }
    };

    checkFont();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = 600;

    const skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height * 0.3);
    skyGradient.addColorStop(0, '#0a0a1a');
    skyGradient.addColorStop(0.5, '#1a1a35');
    skyGradient.addColorStop(1, '#252545');
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height * 0.3);

    const groundGradient = ctx.createLinearGradient(0, canvas.height * 0.3, 0, canvas.height);
    groundGradient.addColorStop(0, '#252545');
    groundGradient.addColorStop(0.4, '#1a2a1a');
    groundGradient.addColorStop(1, '#0f1f0f');
    ctx.fillStyle = groundGradient;
    ctx.fillRect(0, canvas.height * 0.3, canvas.width, canvas.height * 0.7);

    const trackWidth = canvas.width - 140;
    const trackStartX = 120;
    const numLanes = horses.length > 0 ? horses.length : registeredHorses.length;
    const laneHeight = canvas.height / Math.max(numLanes, 1);

    const trackGradient = ctx.createLinearGradient(trackStartX - 10, 0, trackStartX + trackWidth + 10, 0);
    trackGradient.addColorStop(0, '#1a2a1a');
    trackGradient.addColorStop(0.05, '#2a4a2a');
    trackGradient.addColorStop(0.95, '#2a4a2a');
    trackGradient.addColorStop(1, '#1a2a1a');
    ctx.fillStyle = trackGradient;
    ctx.fillRect(trackStartX - 10, 0, trackWidth + 20, canvas.height);

    ctx.globalAlpha = 0.15;
    for (let i = 0; i < 100; i++) {
      const x = trackStartX + Math.random() * trackWidth;
      const y = Math.random() * canvas.height;
      const size = Math.random() * 3;
      ctx.fillStyle = Math.random() > 0.5 ? '#3a5a3a' : '#1a3a1a';
      ctx.fillRect(x, y, size, size);
    }
    ctx.globalAlpha = 1.0;

    const borderGlow = ctx.createLinearGradient(trackStartX - 15, 0, trackStartX - 5, 0);
    borderGlow.addColorStop(0, 'rgba(0, 200, 255, 0)');
    borderGlow.addColorStop(1, 'rgba(0, 200, 255, 0.6)');
    ctx.fillStyle = borderGlow;
    ctx.fillRect(trackStartX - 15, 0, 10, canvas.height);

    const borderGlowRight = ctx.createLinearGradient(trackStartX + trackWidth + 5, 0, trackStartX + trackWidth + 15, 0);
    borderGlowRight.addColorStop(0, 'rgba(0, 200, 255, 0.6)');
    borderGlowRight.addColorStop(1, 'rgba(0, 200, 255, 0)');
    ctx.fillStyle = borderGlowRight;
    ctx.fillRect(trackStartX + trackWidth + 5, 0, 10, canvas.height);

    ctx.strokeStyle = '#00d9ff';
    ctx.lineWidth = 4;
    ctx.shadowColor = '#00d9ff';
    ctx.shadowBlur = 15;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(trackStartX, 0);
    ctx.lineTo(trackStartX, canvas.height);
    ctx.stroke();
    ctx.shadowBlur = 0;

    const finishLineX = trackStartX + trackWidth;

    const spotlightGradient = ctx.createRadialGradient(
      finishLineX, canvas.height / 2, 0,
      finishLineX, canvas.height / 2, 200
    );
    spotlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.2)');
    spotlightGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.1)');
    spotlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = spotlightGradient;
    ctx.fillRect(finishLineX - 200, 0, 400, canvas.height);

    const checkSize = 10;
    for (let y = 0; y < canvas.height; y += checkSize) {
      for (let x = 0; x < 20; x += checkSize) {
        const isBlack = ((x + y) / checkSize) % 2 === 0;
        ctx.fillStyle = isBlack ? '#000000' : '#ffffff';
        ctx.fillRect(finishLineX + x - 10, y, checkSize, checkSize);
      }
    }

    ctx.strokeStyle = '#00ff88';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#00ff88';
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.moveTo(finishLineX - 10, 0);
    ctx.lineTo(finishLineX - 10, canvas.height);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(finishLineX + 10, 0);
    ctx.lineTo(finishLineX + 10, canvas.height);
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#00d9ff';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#00d9ff';
    ctx.shadowBlur = 10;
    ctx.save();
    ctx.translate(trackStartX - 25, canvas.height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('START', 0, 0);
    ctx.restore();

    ctx.fillStyle = '#00ff88';
    ctx.shadowColor = '#00ff88';
    ctx.shadowBlur = 10;
    ctx.save();
    ctx.translate(finishLineX + 35, canvas.height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('FINISH', 0, 0);
    ctx.restore();
    ctx.shadowBlur = 0;

    for (let index = 1; index < numLanes; index++) {
      ctx.strokeStyle = 'rgba(0, 200, 255, 0.3)';
      ctx.lineWidth = 1;
      ctx.setLineDash([10, 10]);
      ctx.beginPath();
      ctx.moveTo(trackStartX, index * laneHeight);
      ctx.lineTo(trackStartX + trackWidth, index * laneHeight);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    if (status === 'racing' && horses.length > 0) {
      const leadingHorse = horses.reduce((leader, horse) =>
        horse.progress > leader.progress ? horse : leader
      , horses[0]);

      if (!leadingHorse.finished) {
        const htmlLeftPercent = 12 + ((86 * leadingHorse.progress) / 100);
        const leaderCenterX = (canvas.width * htmlLeftPercent) / 100;
        const horseHalfWidth = 18;
        const leaderX = leaderCenterX + horseHalfWidth;

        ctx.strokeStyle = leadingHorse.color || '#ffff00';
        ctx.lineWidth = 3;
        ctx.setLineDash([8, 8]);
        ctx.shadowColor = leadingHorse.color || '#ffff00';
        ctx.shadowBlur = 15;
        ctx.globalAlpha = 0.8;
        ctx.beginPath();
        ctx.moveTo(leaderX, 0);
        ctx.lineTo(leaderX, canvas.height);
        ctx.stroke();
        ctx.globalAlpha = 1.0;
        ctx.shadowBlur = 0;
        ctx.setLineDash([]);
      }
    }

  }, [horses, status, registeredHorses, fontLoaded]);

  const trackWidth = 100;
  const trackStartPercent = 12;

  if (!fontLoaded) {
    return (
      <div className="relative w-full bg-gray-900/50 border border-gray-700 rounded-lg flex items-center justify-center" style={{ height: '600px' }}>
        <Loader text="Loading race track..." size="lg" />
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative w-full" style={{ height: '600px' }}>
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 w-full rounded-lg"
        style={{
          height: '600px',
          border: '2px solid rgba(0, 217, 255, 0.6)',
          boxShadow: '0 0 20px rgba(0, 217, 255, 0.4), inset 0 0 20px rgba(0, 217, 255, 0.1)',
        }}
      />

      {status === 'waiting' && (() => {
        const startingSoon = raceStartTime ? (() => {
          const startTimeUTC = new Date(raceStartTime + 'Z').getTime();
          const now = Date.now();
          const diff = startTimeUTC - now;
          return diff < 10000;
        })() : false;

        if (startingSoon) {
          const laneHeight = 100 / Math.max(registeredHorses.length, 1);

          return registeredHorses.map((horse, index) => {
            const isUserHorse = userHorseIds.includes(horse.horse_id);
            const laneCenterPercent = index * laneHeight + (laneHeight / 2);
            const horseColor = horse.color || '#ffffff';

            return (
              <div
                key={`lineup-${horse.horse_id}`}
                className="absolute transition-all duration-1000"
                style={{
                  left: `${trackStartPercent + 1}%`,
                  top: `${laneCenterPercent}%`,
                  transform: 'translate(-50%, -50%)',
                }}
              >
                {isUserHorse && (
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-sm text-red-500 font-bold">
                    &#129035;
                  </div>
                )}

                {!isUserHorse && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-center whitespace-nowrap">
                    <div className="!text-[10px] px-1 py-[2px] rounded bg-[rgba(0,0,0,0.3)] text-gray-200 font-medium">
                      {horse.owner_name ? horse.owner_name.slice(0, 6) + '...' : 'Unknown'}
                    </div>
                  </div>
                )}

                <div
                  className="text-4xl leading-none relative"
                  style={{
                    color: horseColor,
                    filter: isUserHorse
                      ? `drop-shadow(0 0 12px ${horseColor}) drop-shadow(0 0 24px ${horseColor}) drop-shadow(0 0 36px ${horseColor})`
                      : `drop-shadow(0 0 8px ${horseColor}) drop-shadow(0 2px 4px rgba(0,0,0,0.8))`,
                    fontFamily: "'Muybridge', 'Apple Color Emoji', 'Segoe UI Emoji', sans-serif",
                  }}
                >
                  🐎
                </div>

                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 text-center whitespace-nowrap">
                  <div className="text-xs font-semibold flex items-center gap-1" style={{ color: horseColor }}>
                    {horse.horse_name || 'Unknown Horse'}
                    {horse?.goodluck_used && (
                    <span className="text-lg goodluck-glow"><GiHorseshoe className='mb-1 goodluck-glow text-neon-green w-3 h-3' /></span>
                  )}
                  </div>
                </div>
              </div>
            );
          });
        }

        return Array.from(wanderingHorses.entries()).map(([horseId, pos]) => {
          const horse = registeredHorses.find(h => h.horse_id === horseId);
          if (!horse) return null;

          const isUserHorse = userHorseIds.includes(horseId);
          const horseColor = horse.color || '#ffffff';

          return (
            <div
              key={`wander-${horseId}`}
              className="absolute transition-all duration-100"
              style={{
                left: `${pos.x}%`,
                top: `${pos.y}%`,
                transform: 'translate(-50%, -50%)',
              }}
            >
              {!isUserHorse && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-center whitespace-nowrap">
                  <div className="!text-[10px] px-1 py-[2px] rounded bg-[rgba(0,0,0,0.3)] text-gray-200 font-medium">
                    {horse.owner_name ? horse.owner_name.slice(0, 6) + '...' : 'Unknown'}
                  </div>
                </div>
              )}

              {isUserHorse && (
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-sm text-red-500 font-bold">
                  &#129035;
                </div>
              )}

              <div
                className="text-3xl leading-none horse-animated relative"
                style={{
                  color: horseColor,
                  filter: isUserHorse
                    ? `drop-shadow(0 0 10px ${horseColor}) drop-shadow(0 0 20px ${horseColor})`
                    : `drop-shadow(0 0 6px ${horseColor}) drop-shadow(0 2px 4px rgba(0,0,0,0.8))`,
                  fontFamily: "'Muybridge', 'Apple Color Emoji', 'Segoe UI Emoji', sans-serif",
                  transform: pos.direction === 'left' ? 'scaleX(-1)' : 'scaleX(1)',
                }}
              >
                🐎

              </div>

              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 text-center whitespace-nowrap">
                <div className="text-xs font-semibold flex items-center gap-1" style={{ color: horseColor }}>
                  {horse.horse_name || 'Unknown Horse'}
                  {horse.goodluck_used && (
                  <span className="text-sm goodluck-glow"><GiHorseshoe className='mb-1 goodluck-glow text-neon-green w-3 h-3' /></span>
                )}
                </div>
              </div>
            </div>
          );
        });
      })()}

      {raceStartProgress.isActive && (
        <RaceStartProgress
          timeRemaining={raceStartProgress.timeRemaining}
          totalDuration={raceStartProgress.totalDuration}
        />
      )}

      {(status === 'racing' || status === 'done' || status === 'cancelled') && (() => {
        const displayHorses = (status === 'done' || status === 'cancelled') && horses.length === 0
          ? registeredHorses
              .sort((a: any, b: any) => {
                const aTime = new Date(a.created_at).getTime();
                const bTime = new Date(b.created_at).getTime();
                return aTime - bTime;
              })
              .map((h, idx) => ({
                horse_id: h.horse_id,
                horse_name: h.horse_name,
                color: h.color,
                owner_name: h.owner_name ? h.owner_name.slice(0, 6) + '...' : 'Unknown',
                progress: status === 'cancelled' ? 1 : 100,
                finished: status === 'done',
                goodluck_used: h.goodluck_used
              }))
          : horses.map(h => {
              const registered = registeredHorses.find(r => r.horse_id === h.horse_id);
              return {
                ...h,
                goodluck_used: registered?.goodluck_used || false
              };
            });

        const leadingHorse = displayHorses.reduce((leader, h) =>
          h.progress > leader.progress ? h : leader
        , displayHorses[0]);

        return displayHorses.map((horse, index) => {
        const isUserHorse = userHorseIds.includes(horse.horse_id);
        const isLeader = horse.horse_id === leadingHorse.horse_id && status === 'racing' && !horse.finished;
        const isUserLeader = isUserHorse && isLeader;
        const laneHeight = 100 / Math.max(displayHorses.length, 1);
        const laneTopPercent = index * laneHeight;
        const laneCenterPercent = laneTopPercent + (laneHeight / 2);

        const horseLeftPercent = trackStartPercent + ((trackWidth - 14) * horse.progress / 100);

        return (
          <div
            key={horse.horse_id}
            className="absolute transition-all duration-100"
            style={{
              left: `${horseLeftPercent}%`,
              top: `${laneCenterPercent}%`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            {isUserLeader && (
              <div className="absolute inset-0 pointer-events-none">
                <div
                  className="boost-ring absolute rounded-full border-4"
                  style={{
                    borderColor: horse.color || '#fff',
                    width: '60px',
                    height: '60px',
                    left: '50%',
                    top: '50%',
                    transform: 'translate(-50%, -50%)',
                  }}
                />
              </div>
            )}

            {isLeader && (
              <div
                className="absolute right-full mr-1 whitespace-nowrap pointer-events-none"
                style={{
                  top: '50%',
                  transform: 'translateY(-50%)',
                }}
              >
                <span className="dust-cloud text-2xl" style={{ color: horse.color || '#888' }}>💨</span>
              </div>
            )}

            {isUserHorse ? (
              <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-sm text-red-500 font-bold px-2 py-0 rounded bg-[rgba(0,0,0,0.3)] flex items-center h-6">
                 &#129035;
              </div>
            ) : <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-center whitespace-nowrap">
              <div className="!text-[10px] px-1 py-[2px] rounded bg-[rgba(0,0,0,0.3)] text-gray-200 font-medium flex items-center">
                {horse.owner_name ? horse.owner_name.slice(0, 6) + '...' : 'Unknown'}
              </div>
            </div>}

            <div
              className={`text-4xl leading-none relative ${!horse.finished && status === 'racing' ? 'horse-animated' : ''
                }`}
              style={{
                color: horse.color || '#ffffff',
                filter: isUserHorse
                  ? `drop-shadow(0 0 12px ${horse.color || '#fff'}) drop-shadow(0 0 24px ${horse.color || '#fff'}) drop-shadow(0 0 36px ${horse.color || '#fff'})`
                  : `drop-shadow(0 0 8px ${horse.color || '#fff'}) drop-shadow(0 2px 4px rgba(0,0,0,0.8))`,
                fontFamily: "'Muybridge', 'Apple Color Emoji', 'Segoe UI Emoji', sans-serif",
              }}
            >
              🐎
              
            </div>

            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 text-center whitespace-nowrap">
              <div className="text-xs font-semibold flex items-center gap-1" style={{ color: horse.color || '#ffffff' }}>
                {horse.horse_name}
                {(horse as any)?.goodluck_used && (
                <span className="text-lg goodluck-glow"><GiHorseshoe className='mb-1 goodluck-glow text-neon-green w-3 h-3' /></span>
              )}
              </div>
            </div>
          </div>
        );
      });
      })()}

      {status === 'racing' && horses.length > 0 && horses.every(h => h.finished) && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="absolute inset-0 bg-black/40" />

          <div className="finish-banner relative z-10 bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 px-12 py-6 rounded-2xl border-4 border-white">
            <div
              className="text-5xl font-black text-white text-center flex items-center gap-4"
              style={{
                textShadow: '0 0 20px rgba(0,0,0,0.8), 0 4px 8px rgba(0,0,0,0.6)',
                WebkitTextStroke: '2px rgba(0, 0, 0, 0.5)',
              }}
            >
              <div className="animate-spin">⚙️</div>
              CALCULATING RESULTS
              <div className="animate-spin">⚙️</div>
            </div>
            <div className="text-center text-white text-lg font-bold mt-2 animate-pulse" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
              Processing race results and distributing rewards...
            </div>
          </div>
        </div>
      )}

      {status === 'done' && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="absolute inset-0 bg-black/60" />

          <div className="finish-banner relative z-10 bg-gradient-to-r from-cyan-500 via-green-500 to-yellow-500 px-12 py-6 rounded-2xl border-4 border-white">
            <div
              className="text-6xl font-black text-white text-center"
              style={{
                textShadow: '0 0 20px rgba(0,0,0,0.8), 0 4px 8px rgba(0,0,0,0.6)',
                WebkitTextStroke: '2px rgba(0, 0, 0, 0.5)',
              }}
            >
              🏁 RACE FINISHED 🏁
            </div>
            <div className="text-center text-white text-xl font-bold mt-2" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
              Check the results below
            </div>
          </div>
        </div>
      )}

      {status === 'cancelled' && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="absolute inset-0 bg-black/60" />

          <div className="finish-banner relative z-10 bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 px-12 py-6 rounded-2xl border-4 border-white">
            <div
              className="text-6xl font-black text-white text-center"
              style={{
                textShadow: '0 0 20px rgba(0,0,0,0.8), 0 4px 8px rgba(0,0,0,0.6)',
                WebkitTextStroke: '2px rgba(0, 0, 0, 0.5)',
              }}
            >
              ⚠️ RACE CANCELLED ⚠️
            </div>
            <div className="text-center text-white text-xl font-bold mt-2" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
              Entry fees refunded - Insufficient participants
            </div>
          </div>
        </div>
      )}

      {(status === 'racing' || status === 'done') && (() => {
        if (status === 'done' && horses.length === 0) {
          const sortedResults = [...registeredHorses].sort((a: any, b: any) => {
            const aTime = new Date(a.created_at).getTime();
            const bTime = new Date(b.created_at).getTime();
            return aTime - bTime;
          });

          return sortedResults.map((horse, laneIndex) => {
            const laneHeight = 100 / Math.max(sortedResults.length, 1);
            const laneCenterPercent = laneIndex * laneHeight + (laneHeight / 2);

            return (
              <div
                key={`rank-${horse.horse_id}`}
                className="absolute transition-all duration-300"
                style={{
                  right: '40px',
                  top: `${laneCenterPercent}%`,
                  transform: 'translateY(-50%)',
                  zIndex: 10,
                }}
              >
                <div
                  className="w-[30px] h-[30px] flex items-center justify-center font-bold text-lg"
                  style={{
                    color: horse.color || '#ffffff',
                    textShadow: '0 0 4px rgba(0,0,0,0.8), 0 2px 4px rgba(0,0,0,0.5)'
                  }}
                >
                  {horse.finish_position || '?'}
                </div>
              </div>
            );
          });
        }

        const sortedHorses = [...horses].sort((a, b) => {
          const aFinished = finishOrder.has(a.horse_id);
          const bFinished = finishOrder.has(b.horse_id);

          if (aFinished && bFinished) {
            return finishOrder.get(a.horse_id)! - finishOrder.get(b.horse_id)!;
          }

          if (aFinished) return -1;
          if (bFinished) return 1;

          return b.progress - a.progress;
        });

        return sortedHorses.map((horse, rankIndex) => {
          const laneIndex = horses.findIndex(h => h.horse_id === horse.horse_id);
          const laneHeight = 100 / Math.max(horses.length, 1);
          const laneCenterPercent = laneIndex * laneHeight + (laneHeight / 2);

          const currentRank = finishOrder.has(horse.horse_id)
            ? finishOrder.get(horse.horse_id)!
            : rankIndex + 1;

          return (
            <div
              key={`rank-${horse.horse_id}`}
              className="absolute transition-all duration-300"
              style={{
                right: '40px',
                top: `${laneCenterPercent}%`,
                transform: 'translateY(-50%)',
                zIndex: 10,
              }}
            >
              <div
                className="w-[30px] h-[30px] flex items-center justify-center font-bold text-lg"
                style={{
                  color: horse.color || '#ffffff',
                  textShadow: '0 0 4px rgba(0,0,0,0.8), 0 2px 4px rgba(0,0,0,0.5)'
                }}
              >
                <span>#</span>{currentRank}
              </div>
            </div>
          );
        });
      })()}
    </div>
  );
}
