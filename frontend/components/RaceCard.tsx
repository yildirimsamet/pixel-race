'use client';

import { Race } from '@/types';
import Link from 'next/link';
import moment from 'moment';
import { useEffect, useState, useRef } from 'react';
import { GiHorseHead, GiTrophy } from 'react-icons/gi';
import { FaCoins, FaClock, FaUsers, FaListUl } from 'react-icons/fa';
import { MdPlayArrow } from 'react-icons/md';
import { IoEnter } from 'react-icons/io5';
import { TbFlame } from 'react-icons/tb';
import { SiSolana } from 'react-icons/si';
import { useVisibleCountdown } from '@/hooks/useVisibleCountdown';

interface RaceCardProps {
  race: Race;
}

export default function RaceCard({ race }: RaceCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const visibleNow = useVisibleCountdown(cardRef);
  const [timeDisplay, setTimeDisplay] = useState('');

  const statusColors = {
    waiting: 'bg-yellow-600',
    racing: 'bg-neon-red shadow-neon-red',
    done: 'bg-neon-red',
    cancelled: 'bg-red-600',
  };

  const statusLabels = {
    waiting: 'Waiting',
    racing: 'LIVE',
    done: 'Done',
    cancelled: 'Cancelled',
  };

  useEffect(() => {
    if (!visibleNow && race.status !== 'waiting') return;

    const startTime = moment.utc(race.start_time);
    const now = moment.utc(visibleNow || Date.now());
    const timeUntilStart = startTime.diff(now);

    let display = '';
    if (race.status === 'waiting') {
      if (timeUntilStart > 0) {
        const duration = moment.duration(timeUntilStart);
        const hours = Math.floor(duration.asHours());
        const minutes = duration.minutes();
        const seconds = duration.seconds();

        if (hours > 0) {
          display = `${hours}h ${minutes}m ${seconds}s`;
        } else if (minutes > 0) {
          display = `${minutes}m ${seconds}s`;
        } else {
          display = `${seconds}s`;
        }
      } else {
        display = 'Starting...';
      }
    } else if (race.status === 'racing') {
      display = 'Live Now!';
    } else if (race.status === 'done') {
      display = startTime.local().format('MMM D, HH:mm');
    } else {
      display = 'Cancelled';
    }

    setTimeDisplay(display);
  }, [visibleNow, race.start_time, race.status]);

  const levelColors = {
    1: { border: 'border-neon-green/50', bg: 'from-neon-green/10 to-neon-green/5', glow: 'shadow-neon-green', text: 'text-neon-green' },
    2: { border: 'border-neon-blue/50', bg: 'from-neon-blue/10 to-neon-blue/5', glow: 'shadow-neon', text: 'text-neon-blue' },
    3: { border: 'border-neon-purple/50', bg: 'from-neon-purple/10 to-neon-purple/5', glow: 'shadow-neon-purple', text: 'text-neon-purple' },
  };

  const levelStyle = levelColors[race.level_requirement as keyof typeof levelColors];

  return (
    <div ref={cardRef} className={`glass card-hover relative overflow-hidden rounded-2xl p-6 border ${levelStyle.border} ${levelStyle.glow} group animate-fade-in`}>
      <div className={`absolute inset-0 bg-gradient-to-br ${levelStyle.bg} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>

      <div className={`absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br ${levelStyle.bg} rounded-full blur-3xl opacity-30 group-hover:opacity-50 transition-opacity duration-500`}></div>

      <div className="relative z-10">
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-3">
            <div className={`${levelStyle.text} text-3xl animate-float`}>
              <GiTrophy className="drop-shadow-lg" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-xl font-bold">Level {race.level_requirement} Race</h3>
                {race.max_horses === 2 && (
                  <span className="bg-gradient-to-r from-orange-600 to-red-600 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide shadow-lg border border-orange-400/50">
                    1v1
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-gray-500 text-sm">
                <FaUsers className={levelStyle.text} />
                <span>Min {race.min_horses} horses needed to start.</span>
              </div>
            </div>
          </div>

          <span className={`${statusColors[race.status]} px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide flex items-center gap-2 shadow-lg ${race.status === 'racing' ? 'animate-pulse' : ''}`}>
            {race.status === 'racing' && (
              <span className="relative flex h-3 w-3">
                <span className="pulse-ring absolute inline-flex h-full w-full rounded-full bg-white"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-neon-red"></span>
              </span>
            )}
            {statusLabels[race.status]}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="glass rounded-xl p-3 text-center border border-neon-yellow/30 hover:border-neon-yellow/60 transition-colors">
            <SiSolana className="text-neon-purple text-xl mx-auto mb-2 animate-pulse-slow" />
            <p className="text-xs text-gray-400 mb-1">Entry Fee</p>
            <p className="text-neon-blue font-bold text-sm">{race.entry_fee} SOL</p>
          </div>

          <div className="glass rounded-xl p-3 text-center border border-neon-blue/30 hover:border-neon-blue/60 transition-colors">
            <FaClock className={`${race.status === 'racing' ? 'text-neon-red animate-pulse' : 'text-neon-blue'} text-xl mx-auto mb-2`} />
            <p className="text-xs text-gray-400 mb-1">{race.status === 'waiting' ? 'Starts in' : 'Started'}</p>
            <p className={`${race.status === 'racing' ? 'text-neon-red font-extrabold' : 'text-white'} font-bold text-sm`}>
              {timeDisplay}
            </p>
          </div>

          <div className="glass rounded-xl p-3 text-center border border-neon-purple/30 hover:border-neon-purple/60 transition-colors">
            <GiHorseHead className="text-neon-purple text-xl mx-auto mb-2 animate-pulse-slow" />
            <p className="text-xs text-gray-400 mb-1">Joined</p>
            <p className="text-white font-bold text-lg">{race.registered_horses}/{race.max_horses}</p>
          </div>
        </div>

        <Link
          href={`/race/${race.id}`}
          className={`btn-neon block w-full text-center bg-gradient-to-r ${
            race.status === 'waiting'
              ? 'from-neon-green to-green-600 hover:from-neon-green hover:to-neon-blue'
              : 'from-neon-blue to-blue-600 hover:from-neon-blue hover:to-neon-purple'
          } py-4 rounded-xl transition-all font-bold text-lg flex items-center justify-center gap-3 relative overflow-hidden`}
        >
          {race.status === 'waiting' ? (
            <>
              <IoEnter className="text-2xl" />
              <span>Join Race</span>
            </>
          ) : race.status === 'racing' ? (
            <>
              <span className="text-2xl">🔴</span>
              <span className="text-glow font-extrabold tracking-wide">WATCH LIVE</span>
            </>
          ) : (
            <>
              <FaListUl className="text-2xl" />
              <span>View Results</span>
            </>
          )}
        </Link>
      </div>
    </div>
  );
}
