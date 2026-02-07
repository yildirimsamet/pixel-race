'use client';

import { useEffect, useRef, memo } from 'react';

interface RaceTrackCanvasProps {
  horses: any[];
  registeredHorses: any[];
  status: string;
}

function RaceTrackCanvas({ horses, registeredHorses, status }: RaceTrackCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = 600;

    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(1, '#16213e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const trackWidth = canvas.width - 140;
    const trackStartX = 120;
    const numLanes = horses.length > 0 ? horses.length : registeredHorses.length;
    const laneHeight = canvas.height / Math.max(numLanes, 1);

    ctx.fillStyle = '#2a4a2a';
    ctx.fillRect(trackStartX - 10, 0, trackWidth + 20, canvas.height);

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(trackStartX, 0);
    ctx.lineTo(trackStartX, canvas.height);
    ctx.stroke();

    const finishLineX = trackStartX + trackWidth;
    const checkSize = 10;
    for (let y = 0; y < canvas.height; y += checkSize) {
      for (let x = 0; x < 20; x += checkSize) {
        const isBlack = ((x + y) / checkSize) % 2 === 0;
        ctx.fillStyle = isBlack ? '#00000080' : '#ffffff80';
        ctx.fillRect(finishLineX + x - 10, y, checkSize, checkSize);
      }
    }

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.save();
    ctx.translate(trackStartX - 20, canvas.height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('START', 0, 0);
    ctx.restore();

    ctx.save();
    ctx.translate(finishLineX + 30, canvas.height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('FINISH', 0, 0);
    ctx.restore();

    for (let index = 1; index < numLanes; index++) {
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, index * laneHeight);
      ctx.lineTo(canvas.width, index * laneHeight);
      ctx.stroke();
    }

    if (status === 'racing' && horses.length > 0) {
      const leadingHorse = horses.reduce((leader, horse) =>
        horse.progress > leader.progress ? horse : leader, horses[0]);

      if (!leadingHorse.finished) {
        const htmlLeftPercent = 12 + ((86 * leadingHorse.progress) / 100);
        const leaderCenterX = (canvas.width * htmlLeftPercent) / 100;
        const horseHalfWidth = 18;
        const leaderX = leaderCenterX + horseHalfWidth;

        ctx.strokeStyle = leadingHorse.color || '#ffffff';
        ctx.lineWidth = 3;
        ctx.setLineDash([5, 5]);
        ctx.globalAlpha = 0.7;
        ctx.beginPath();
        ctx.moveTo(leaderX, 0);
        ctx.lineTo(leaderX, canvas.height);
        ctx.stroke();
        ctx.globalAlpha = 1.0;
        ctx.setLineDash([]);
      }
    }

    if (status === 'done') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#22c55e';
      ctx.font = 'bold 48px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      ctx.shadowBlur = 10;
      ctx.fillText('🏁 RACE FINISHED 🏁', canvas.width / 2, canvas.height / 2);
      ctx.shadowBlur = 0;
    }
  }, [horses, status, registeredHorses]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute top-0 left-0 w-full border border-gray-700 rounded-lg"
      style={{ height: '600px' }}
    />
  );
}

export default memo(RaceTrackCanvas);
