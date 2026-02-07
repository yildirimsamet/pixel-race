'use client';

import { Race } from '@/types';
import { FaClock } from 'react-icons/fa';
import { SiSolana } from 'react-icons/si';
import { GiHorseHead } from 'react-icons/gi';
import { MdTimer, MdCheckCircle, MdCancel } from 'react-icons/md';
import { TbFlame } from 'react-icons/tb';
import moment from 'moment';

interface RaceStatsGridProps {
  race: Race;
  timeUntilStart: string;
  isLineup: boolean;
}

export default function RaceStatsGrid({ race, timeUntilStart, isLineup }: RaceStatsGridProps) {
  const getStatusIcon = () => {
    if (race.status === 'waiting') {
      return <MdTimer className={`${isLineup ? 'text-neon-orange' : 'text-neon-yellow'} text-2xl animate-pulse-slow`} />;
    }
    if (race.status === 'racing') {
      return <TbFlame className="text-neon-red text-2xl animate-pulse" />;
    }
    if (race.status === 'done') {
      return <MdCheckCircle className="text-neon-blue text-2xl" />;
    }
    return <MdCancel className="text-red-500 text-2xl" />;
  };

  const getStatusText = () => {
    if (race.status === 'waiting') {
      return isLineup ? 'LINEUP' : 'WAITING';
    }
    if (race.status === 'racing') {
      return (
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="pulse-ring absolute inline-flex h-full w-full rounded-full bg-neon-red"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-neon-red"></span>
          </span>
          <span className="text-neon-red">LIVE</span>
        </div>
      );
    }
    if (race.status === 'done') return 'FINISHED';
    return 'CANCELLED';
  };

  const getStatusColor = () => {
    if (race.status === 'waiting') return isLineup ? 'text-neon-orange' : 'text-neon-yellow';
    if (race.status === 'racing') return 'text-neon-red font-extrabold';
    if (race.status === 'done') return 'text-neon-blue';
    return 'text-red-500';
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="glass rounded-2xl p-5 border border-white/10 hover:border-neon-blue/40 transition-all">
        <div className="flex items-center gap-2 mb-3">
          {getStatusIcon()}
        </div>
        <p className="text-xs text-gray-400 mb-1">Status</p>
        <div className={`text-xl font-bold ${getStatusColor()}`}>
          {getStatusText()}
        </div>
      </div>

      <div className="glass rounded-2xl p-5 border border-white/10 hover:border-neon-yellow/40 transition-all">
        <FaClock className="text-neon-yellow text-2xl mb-3 animate-pulse-slow" />
        <p className="text-xs text-gray-400 mb-1">
          {race.status === 'waiting' ? 'Starts In' : race.status === 'done' ? 'Finished At' : 'Started At'}
        </p>
        <div className="text-lg font-bold text-white">
          {race.status === 'waiting' && timeUntilStart
            ? timeUntilStart
            : race.start_time
              ? moment.utc(race.start_time).local().format('HH:mm:ss')
              : 'N/A'}
        </div>
      </div>

      <div className="glass rounded-2xl p-5 border border-white/10 hover:border-neon-yellow/40 transition-all">
        <SiSolana className="text-neon-blue text-2xl mb-3 animate-pulse-slow" />
        <p className="text-xs text-gray-400 mb-1">Entry Fee</p>
        <div className="text-xl font-bold text-neon-yellow">{race.entry_fee}</div>
      </div>

      <div className="glass rounded-2xl p-5 border border-white/10 hover:border-neon-purple/40 transition-all">
        <GiHorseHead className="text-neon-purple text-2xl mb-3 animate-pulse-slow" />
        <p className="text-xs text-gray-400 mb-1">Participants</p>
        <div className="text-xl font-bold text-white">
          {race.registered_horses} / {race.max_horses}
        </div>
      </div>
    </div>
  );
}
