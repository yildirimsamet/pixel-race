'use client';

import { useState, useMemo, useCallback } from 'react';
import { Race } from '@/types';
import { useRaces } from '@/hooks/useRaces';
import RaceCard from '@/components/RaceCard';
import HeroHeader from '@/components/HeroHeader';
import FeaturedRace from '@/components/FeaturedRace';
import SectionHeader from '@/components/SectionHeader';
import EmptyState from '@/components/EmptyState';
import Loader from '@/components/Loader';
import HolderPerksTeaser from '@/components/token/HolderPerksTeaser';
import { GiHorseHead, GiTrophy } from 'react-icons/gi';
import { MdPlayCircle, MdSchedule } from 'react-icons/md';

const REFRESH_INTERVAL = 5000;

export default function Home() {
  const { races, loading, error, refetch } = useRaces(undefined, REFRESH_INTERVAL);

  const { activeRaces, upcomingRaces, nextRace } = useMemo(() => {
    const active = races.filter(race => race.status === 'racing');
    const upcoming = races
      .filter(race => race.status === 'waiting')
      .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

    return {
      activeRaces: active,
      upcomingRaces: upcoming,
      nextRace: upcoming[0],
    };
  }, [races]);

  if (error) {
    return (
      <div className="space-y-12 animate-fade-in">
        <EmptyState
          icon={<GiTrophy className="text-7xl text-red-400" />}
          title="Failed to Load Races"
          description={error}
        />
        <div className="text-center">
          <button
            onClick={refetch}
            className="btn-neon bg-gradient-to-r from-neon-blue to-blue-600 hover:from-neon-blue hover:to-neon-purple px-6 py-3 rounded-xl font-bold"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-fade-in">
      <HeroHeader
        icon={<GiHorseHead className="animate-glow" />}
        title={
          <span className="bg-gradient-to-r from-neon-blue via-neon-purple to-neon-pink bg-clip-text text-transparent">
            Pixel Race Arena
          </span>
        }
        subtitle="Real-time multiplayer horse racing • Win rewards • Collect champions"
      />

      {!loading && nextRace && <FeaturedRace race={nextRace} />}

      <HolderPerksTeaser />

      <RaceSection
        title="Live Races"
        icon={
          <div className="relative">
            <MdPlayCircle className="text-4xl text-neon-green" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="pulse-ring absolute inline-flex h-full w-full rounded-full bg-neon-red" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-neon-red" />
            </span>
          </div>
        }
        races={activeRaces}
        loading={loading}
        emptyIcon={<GiTrophy className="text-7xl text-gray-600" />}
        emptyTitle="No Active Races"
        emptyDescription="New races start every few minutes. Check back soon!"
        badgeColor="bg-neon-red/20 border border-neon-red/50 text-neon-red"
        badgeText="LIVE"
      />

      <RaceSection
        title="Upcoming Races"
        icon={<MdSchedule className="text-4xl text-neon-yellow" />}
        races={upcomingRaces.slice(1)}
        loading={false}
        emptyIcon={<MdSchedule className="text-7xl text-gray-600" />}
        emptyTitle="No Scheduled Races"
        emptyDescription="Races are created automatically. Stay tuned!"
        badgeColor="bg-neon-yellow text-dark-900"
        badgeText="Scheduled"
      />
    </div>
  );
}

interface RaceSectionProps {
  title: string;
  icon: React.ReactNode;
  races: Race[];
  loading: boolean;
  emptyIcon: React.ReactNode;
  emptyTitle: string;
  emptyDescription: string;
  badgeColor: string;
  badgeText: string;
}

function RaceSection({
  title,
  icon,
  races,
  loading,
  emptyIcon,
  emptyTitle,
  emptyDescription,
  badgeColor,
  badgeText
}: RaceSectionProps) {
  return (
    <div>
      <SectionHeader
        icon={icon}
        title={title}
        badge={races.length > 0 ? { text: `${races.length} ${badgeText}`, color: badgeColor } : undefined}
      />

      {loading ? (
        <Loader text="Loading races..." />
      ) : races.length === 0 ? (
        <EmptyState
          icon={emptyIcon}
          title={emptyTitle}
          description={emptyDescription}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {races.map((race, index) => (
            <div key={race.id} style={{ animationDelay: `${index * 100}ms` }}>
              <RaceCard race={race} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
