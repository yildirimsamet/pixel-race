'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { races as racesApi } from '@/lib/api';
import { Race } from '@/types';
import RaceCard from '@/components/RaceCard';
import { MdStadium, MdFilterList } from 'react-icons/md';
import Loader from '@/components/Loader';
import { GiTrophy } from 'react-icons/gi';
import { FaListUl, FaPlay, FaCheckCircle, FaClock } from 'react-icons/fa';

const ITEMS_PER_PAGE = 9;

const STATUS_ORDER: Record<Race['status'], number> = {
  racing: 1,
  waiting: 2,
  done: 3,
  cancelled: 4,
};

export default function RacesPage() {
  const [allRaces, setAllRaces] = useState<Race[]>([]);
  const [displayedRaces, setDisplayedRaces] = useState<Race[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const observerTarget = useRef<HTMLDivElement>(null);

  const loadRaces = useCallback(async () => {
    try {
      const statusFilter = filter === 'all' ? undefined : filter;
      const data = await racesApi.getAll(statusFilter);

      const sortedRaces = data.sort((a: Race, b: Race) => {
        const statusDiff = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
        if (statusDiff !== 0) return statusDiff;

        const dateA = new Date(a.start_time).getTime();
        const dateB = new Date(b.start_time).getTime();

        if (a.status === 'racing' || a.status === 'waiting') {
          return dateA - dateB;
        } else {
          return dateB - dateA;
        }
      });
      setAllRaces(sortedRaces);
    } catch (error) {
      console.error('Failed to load races:', error);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  const loadMoreRaces = useCallback(() => {
    const startIndex = 0;
    const endIndex = page * ITEMS_PER_PAGE;
    const newDisplayed = allRaces.slice(startIndex, endIndex);
    setDisplayedRaces(newDisplayed);
    setHasMore(endIndex < allRaces.length);
  }, [page, allRaces]);

  useEffect(() => {
    loadRaces();
    const interval = setInterval(loadRaces, 5000);
    return () => clearInterval(interval);
  }, [loadRaces]);

  useEffect(() => {
    setPage(1);
    setDisplayedRaces([]);
  }, [filter]);

  useEffect(() => {
    loadMoreRaces();
  }, [loadMoreRaces]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          setPage((prev) => prev + 1);
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, loading]);

  const filterIcons = {
    all: <FaListUl />,
    waiting: <FaClock />,
    racing: <FaPlay />,
    done: <FaCheckCircle />
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <MdStadium className="text-5xl text-blue-400" />
        <div>
          <h1 className="text-4xl font-bold">All Races</h1>
          <p className="text-gray-400 text-sm mt-1">Browse and join upcoming races</p>
        </div>
      </div>

      <div className="mb-8 bg-gradient-to-br from-gray-800 via-gray-850 to-gray-800 border border-gray-700 rounded-xl p-5 shadow-lg">
        <div className="flex items-center gap-2 mb-4">
          <MdFilterList className="text-2xl text-purple-400" />
          <h2 className="text-lg font-semibold">Filter Races</h2>
        </div>
        <div className="flex flex-wrap gap-3">
          {(['all', 'waiting', 'racing', 'done'] as const).map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-5 py-2.5 rounded-lg transition-all font-semibold flex items-center gap-2 shadow-md hover:shadow-lg ${filter === status
                ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white scale-105'
                : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                }`}
            >
              {filterIcons[status]}
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <Loader text="Loading races..." />
      ) : allRaces.length === 0 ? (
        <div className="text-center text-gray-400 py-12 bg-gray-800/50 border border-gray-700 rounded-xl">
          <GiTrophy className="text-6xl mx-auto mb-4 text-gray-600" />
          <p className="text-lg font-semibold">No races found</p>
          <p className="text-sm mt-2">Try changing the filter or check back later</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedRaces.map(race => (
              <RaceCard key={race.id} race={race} />
            ))}
          </div>

          {hasMore && (
            <div ref={observerTarget} className="py-8">
              <Loader text="Loading more races..." size="sm" />
            </div>
          )}

          {!hasMore && displayedRaces.length > 0 && (
            <div className="text-center text-gray-500 py-8">
              <p className="text-sm">You've reached the end of the list</p>
              <p className="text-xs mt-1">{displayedRaces.length} races shown</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
