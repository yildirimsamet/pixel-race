'use client';

import { useEffect, useRef, useState } from 'react';
import Loader from '@/components/Loader';
import { GiHorseshoe } from 'react-icons/gi';

interface ReplaySegment {
  checkpoint: number;
  time: number;
}

interface ReplayHorse {
  horse_id: string;
  horse_name: string;
  color: string;
  owner_name: string;
  segments: ReplaySegment[];
  finish_time_ms: number;
  finish_position: number;
  created_at: string;
  goodluck_used?: boolean;
}

interface RaceReplayProps {
  horses: ReplayHorse[];
  onReplayEnd?: () => void;
}

export default function RaceReplay({ horses, onReplayEnd }: RaceReplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [fontLoaded, setFontLoaded] = useState(false);

  const horsesRef = useRef(horses.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()));
  const maxDurationRef = useRef(Math.max(...horses.map(h => h.finish_time_ms)));
  const onReplayEndRef = useRef(onReplayEnd);
  const animationStartedRef = useRef(false);

  useEffect(() => {
    onReplayEndRef.current = onReplayEnd;
  }, [onReplayEnd]);

  const [currentTime, setCurrentTime] = useState(0);
  const [horsesProgress, setHorsesProgress] = useState<any[]>([]);
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    const checkFont = async () => {
      try {
        await document.fonts.load('normal 1em Muybridge');
        setTimeout(() => setFontLoaded(true), 100);
      } catch (error) {
        console.error('[RaceReplay] Font loading error:', error);
        setTimeout(() => setFontLoaded(true), 2000);
      }
    };
    checkFont();
  }, []);

  const calculateProgressFromSegments = (elapsed: number, segments: ReplaySegment[]): number => {
    if (!segments || segments.length === 0) {
      return Math.min((elapsed / 30000) * 100, 100);
    }

    let accumulatedTime = 0;
    let lastCheckpoint = 0;

    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      const segmentEndTime = accumulatedTime + segment.time;

      if (elapsed <= segmentEndTime) {
        const segmentProgress = (elapsed - accumulatedTime) / segment.time;
        const segmentDistance = segment.checkpoint - lastCheckpoint;
        const progress = lastCheckpoint + (segmentDistance * segmentProgress);
        return Math.min(progress, 100);
      }

      accumulatedTime = segmentEndTime;
      lastCheckpoint = segment.checkpoint;
    }

    return 100;
  };

  useEffect(() => {
    if (!fontLoaded || horsesRef.current.length === 0) return;

    if (animationStartedRef.current) {
      return;
    }
    animationStartedRef.current = true;

    let localStartTime: number | null = null;
    let localAnimationFrame: number | null = null;
    let lastUpdateTime = 0;
    const UPDATE_INTERVAL = 50;

    const animate = (timestamp: number) => {
      if (!localStartTime) {
        localStartTime = timestamp;
        lastUpdateTime = timestamp;
      }

      const elapsed = timestamp - localStartTime;

      const progress = horsesRef.current.map(horse => {
        const prog = calculateProgressFromSegments(elapsed, horse.segments);
        return {
          horse_id: horse.horse_id,
          horse_name: horse.horse_name,
          progress: prog,
          finished: prog >= 100,
          color: horse.color,
          owner_name: horse.owner_name,
          goodluck_used: horse.goodluck_used,
        };
      });

      if (timestamp - lastUpdateTime >= UPDATE_INTERVAL) {
        setCurrentTime(elapsed);
        setHorsesProgress(progress);
        lastUpdateTime = timestamp;
      }

      if (elapsed >= maxDurationRef.current) {
        setIsFinished(true);
        if (onReplayEndRef.current) {
          onReplayEndRef.current();
        }
        return;
      }

      localAnimationFrame = requestAnimationFrame(animate);
    };

    localAnimationFrame = requestAnimationFrame(animate);

    return () => {
      if (localAnimationFrame) {
        cancelAnimationFrame(localAnimationFrame);
      }
    };
  }, [fontLoaded]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !fontLoaded) return;

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
    const numLanes = horsesRef.current.length;
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
  }, [fontLoaded]);

  const trackWidth = 100;
  const trackStartPercent = 12;

  if (!fontLoaded) {
    return (
      <div className="relative w-full bg-gray-900/50 border border-gray-700 rounded-lg flex items-center justify-center" style={{ height: '620px' }}>
        <Loader text="Loading replay..." size="lg" />
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

      <div className="absolute top-4 left-4 z-20">
        <div className="bg-gradient-to-r from-purple-600/80 to-pink-600/80 px-4 py-2 rounded-lg border-2 border-purple-400 shadow-neon-purple">
          <div className="flex items-center gap-2">
            <div className="text-lg">🎬</div>
            <div className="text-white font-bold">REPLAY</div>
          </div>
        </div>
      </div>

      <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 z-20 w-[90%]">
        <div className="bg-black/80 backdrop-blur-sm rounded-lg px-6 py-3 border border-purple-500/50 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="text-xs text-gray-300 font-mono min-w-[70px]">
              {Math.floor(currentTime / 1000)}s / {Math.floor(maxDurationRef.current / 1000)}s
            </div>
            <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-100"
                style={{ width: `${(currentTime / maxDurationRef.current) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {horsesProgress.map((horse, index) => {
        const canvasHeight = 600;
        const laneHeight = canvasHeight / Math.max(horsesProgress.length, 1);
        const laneCenterPx = (index * laneHeight) + (laneHeight / 2);
        const horseLeftPercent = trackStartPercent + ((trackWidth - 14) * horse.progress / 100);

        return (
          <div
            key={horse.horse_id}
            className="absolute transition-all duration-100"
            style={{
              left: `${horseLeftPercent}%`,
              top: `${laneCenterPx}px`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-center whitespace-nowrap">
              <div className="!text-[10px] px-1 py-[2px] rounded bg-[rgba(0,0,0,0.3)] text-gray-200 font-medium">
                {horse.owner_name ? horse.owner_name.slice(0, 6) + '...' : 'Unknown'}
              </div>
            </div>

            <div
              className={`text-4xl leading-none relative ${!horse.finished ? 'horse-animated' : ''}`}
              style={{
                color: horse.color || '#ffffff',
                filter: `drop-shadow(0 0 8px ${horse.color || '#fff'}) drop-shadow(0 2px 4px rgba(0,0,0,0.8))`,
                fontFamily: "'Muybridge', 'Apple Color Emoji', 'Segoe UI Emoji', sans-serif",
              }}
            >
              🐎

            </div>

            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 text-center whitespace-nowrap">
              <div className="text-xs font-semibold flex items-center gap-1" style={{ color: horse.color || '#ffffff' }}>
                {horse.horse_name}               {horse.goodluck_used && (
                <span className="text-lg goodluck-glow"><GiHorseshoe className='mb-1 goodluck-glow text-neon-green w-3 h-3' /></span>
              )}
              </div>
            </div>
          </div>
        );
      })}

      {horsesProgress.map((horse, index) => {
        const canvasHeight = 600;
        const laneHeight = canvasHeight / Math.max(horsesProgress.length, 1);
        const laneCenterPx = (index * laneHeight) + (laneHeight / 2);

        const finishPosition = horsesRef.current.find(h => h.horse_id === horse.horse_id)?.finish_position || '?';

        return (
          <div
            key={`rank-${horse.horse_id}`}
            className="absolute transition-all duration-300"
            style={{
              right: '40px',
              top: `${laneCenterPx}px`,
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
              #{finishPosition}
            </div>
          </div>
        );
      })}

      {isFinished && (
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
              🏁 REPLAY FINISHED 🏁
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
