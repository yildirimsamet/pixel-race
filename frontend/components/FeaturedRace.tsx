'use client';

import { Race } from '@/types';
import Countdown from './Countdown';
import { TbFlame } from 'react-icons/tb';

interface FeaturedRaceProps {
  race: Race;
}

export default function FeaturedRace({ race }: FeaturedRaceProps) {
  return (
    <div className="glass rounded-3xl p-8 sm:p-10 border border-neon-green/30 shadow-neon-green relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-neon-green/10 rounded-full blur-3xl"></div>

      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-6">
          <TbFlame className="text-4xl text-neon-green animate-pulse" />
          <h2 className="text-3xl sm:text-4xl font-bold text-glow">Next Race Starting Soon</h2>
        </div>

        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div className="space-y-4">
            <div className="glass rounded-2xl p-4 border border-white/10">
              <p className="text-gray-400 text-sm mb-1">Race Details</p>
              <h3 className="text-2xl font-bold text-neon-green mb-3 flex gap-2 items-center">
                Level {race.level_requirement} Championship
                {race.max_horses === 2 && (
                  <span className="bg-gradient-to-r from-orange-600 to-red-600 px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wide shadow-lg border border-orange-400/50 animate-pulse-slow">
                    1v1
                  </span>
                )}
              </h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-400">Entry Fee</p>
                  <p className="text-neon-blue font-bold text-lg">{race.entry_fee} SOL</p>
                </div>
                <div>
                  <p className="text-gray-400">Participants</p>
                  <p className="text-white font-bold text-lg">{race.registered_horses}/{race.max_horses}</p>
                </div>
              </div>
            </div>

            <a
              href={`/race/${race.id}`}
              className="btn-neon bg-gradient-to-r from-neon-green to-green-600 hover:from-neon-green hover:to-neon-blue px-8 py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 w-full"
            >
              <TbFlame className="text-2xl" />
              Join This Race
            </a>
          </div>

          <div>
            <p className="text-center text-gray-400 mb-4 text-sm uppercase tracking-wide">Starts In</p>
            <Countdown targetTime={race.start_time} />
          </div>
        </div>
      </div>
    </div>
  );
}
