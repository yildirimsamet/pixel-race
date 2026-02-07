'use client';

import Link from 'next/link';
import { FaCoins, FaRocket, FaTrophy, FaHorse, FaBolt, FaChartLine, FaUsers, FaShoppingCart, FaGamepad, FaHeart, FaBrain, FaBirthdayCake, FaUtensils, FaDumbbell } from 'react-icons/fa';
import { GiHorseHead, GiWeightLiftingUp, GiAges, GiTrophyCup, GiHorseshoe, GiToken } from 'react-icons/gi';
import { IoSpeedometer, IoTime } from 'react-icons/io5';
import { MdTimeline, MdDeveloperMode, MdSpeed } from 'react-icons/md';
import { SiSolana } from 'react-icons/si';
import { BsCurrencyExchange, BsGlobe2 } from 'react-icons/bs';
import { RiAuctionLine, RiGovernmentLine } from 'react-icons/ri';

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
}

function FeatureCard({ icon, title, description, color }: FeatureCardProps) {
  return (
    <div className="glass p-6 rounded-xl hover:scale-105 transition-all duration-300 border border-white/10 hover:border-white/20">
      <div className={`text-4xl mb-4 ${color}`}>{icon}</div>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-gray-300 leading-relaxed">{description}</p>
    </div>
  );
}

interface StatFactorProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
}

function StatFactor({ icon, title, description, color }: StatFactorProps) {
  return (
    <div className="flex gap-4 p-4 glass rounded-lg hover:bg-white/5 transition-all duration-300">
      <div className={`text-3xl ${color} mt-1`}>{icon}</div>
      <div>
        <h4 className="text-lg font-semibold mb-1">{title}</h4>
        <p className="text-gray-400 text-sm leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

interface RoadmapPhaseProps {
  phase: string;
  quarter: string;
  status: 'completed' | 'in-progress' | 'planned' | 'future';
  statusLabel: string;
  items: { icon: React.ReactNode; text: string; highlight?: boolean }[];
}

function RoadmapPhase({ phase, quarter, status, statusLabel, items }: RoadmapPhaseProps) {
  const statusConfig = {
    completed: {
      borderColor: 'border-neon-green',
      glowColor: 'shadow-neon-green',
      iconBg: 'bg-neon-green/20',
      iconColor: 'text-neon-green',
      labelBg: 'bg-neon-green/20',
      labelText: 'text-neon-green',
      emoji: '✅'
    },
    'in-progress': {
      borderColor: 'border-neon-blue',
      glowColor: 'shadow-neon',
      iconBg: 'bg-neon-blue/20',
      iconColor: 'text-neon-blue',
      labelBg: 'bg-neon-blue/20',
      labelText: 'text-neon-blue',
      emoji: '🚧'
    },
    planned: {
      borderColor: 'border-neon-purple',
      glowColor: 'shadow-neon-purple',
      iconBg: 'bg-neon-purple/20',
      iconColor: 'text-neon-purple',
      labelBg: 'bg-neon-purple/20',
      labelText: 'text-neon-purple',
      emoji: '📋'
    },
    future: {
      borderColor: 'border-neon-pink',
      glowColor: 'shadow-neon-pink',
      iconBg: 'bg-neon-pink/20',
      iconColor: 'text-neon-pink',
      labelBg: 'bg-neon-pink/20',
      labelText: 'text-neon-pink',
      emoji: '🔮'
    }
  };

  const config = statusConfig[status];

  return (
    <div className="relative pl-8 pb-12 last:pb-0">
      <div className={`absolute left-0 top-0 w-6 h-6 rounded-full ${config.iconBg} ${config.borderColor} border-2 flex items-center justify-center`}>
        <span className="text-xs">{config.emoji}</span>
      </div>

      <div className="absolute left-3 top-6 bottom-0 w-0.5 bg-gradient-to-b from-white/20 to-transparent last:hidden"></div>

      <div className={`glass p-6 rounded-xl border ${config.borderColor} ${config.glowColor} hover:scale-[1.02] transition-all duration-300`}>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-2xl font-bold">{phase}</h3>
            <p className="text-gray-400">{quarter}</p>
          </div>
          <div className={`px-4 py-2 rounded-lg ${config.labelBg} ${config.labelText} font-semibold text-sm`}>
            {config.emoji} {statusLabel}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-3">
          {items.map((item, idx) => (
            <div
              key={idx}
              className={`flex items-start gap-3 p-3 rounded-lg transition-all duration-300 ${
                item.highlight
                  ? `bg-gradient-to-r from-${config.iconColor.replace('text-', '')}/20 to-transparent border border-${config.borderColor.replace('border-', '')}/30`
                  : 'bg-white/5 hover:bg-white/10'
              }`}
            >
              <div className={`${config.iconColor} text-xl mt-0.5`}>{item.icon}</div>
              <span className="text-gray-300 text-sm leading-relaxed">{item.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function AboutPage() {
  return (
    <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 animate-fade-in">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16 animate-slide-up">
          <h1 className="text-5xl md:text-6xl font-bold mb-4 text-glow bg-gradient-to-r from-neon-blue via-neon-purple to-neon-pink bg-clip-text text-transparent">
            About Pixel Race
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            The first Web3-powered horse racing game on Solana blockchain
          </p>
        </div>

        <section className="mb-16 glass p-8 rounded-2xl border border-neon-blue/30 shadow-neon">
          <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
            <GiHorseHead className="text-neon-green" />
            What is Pixel Race?
          </h2>
          <p className="text-gray-300 text-lg leading-relaxed mb-4">
            Pixel Race is a revolutionary blockchain-based horse racing game built on the Solana network.
            Purchase unique NFT horses, compete in real-time races, and win SOL prizes. Every horse is a
            one-of-a-kind NFT with distinct attributes that affect race performance.
          </p>
          <p className="text-gray-300 text-lg leading-relaxed">
            Experience the thrill of horse racing combined with the transparency and ownership benefits of
            blockchain technology. All transactions, races, and rewards are processed on-chain, ensuring
            fairness and provable randomness.
          </p>
        </section>

        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8 flex items-center gap-3">
            <FaRocket className="text-neon-purple" />
            How It Works
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              icon={<FaHorse />}
              title="1. Buy NFT Horses"
              description="Purchase mystery boxes containing horses of different levels. Higher levels mean faster horses and more expensive races!"
              color="text-neon-yellow"
            />
            <FeatureCard
              icon={<FaCoins />}
              title="2. Join Races"
              description="Enter upcoming races by paying a small entry fee. Entry fees build the prize pool!"
              color="text-neon-green"
            />
            <FeatureCard
              icon={<FaBolt />}
              title="3. Auto-Start System"
              description="Races begin automatically when the minimum number of horses join. No waiting, no manual triggers - just pure racing action!"
              color="text-neon-orange"
            />
            <FeatureCard
              icon={<IoTime />}
              title="4. Watch Live Races"
              description="Experience real-time race visualization with position updates every 100ms. See your horse compete with dynamic animations and live leaderboards!"
              color="text-neon-blue"
            />
            <FeatureCard
              icon={<FaTrophy />}
              title="5. Win SOL Prizes"
              description="Top 3 finishers split the prize pool: 1st place gets 50%, 2nd gets 30%, and 3rd gets 20%. All payouts are instant and on-chain!"
              color="text-neon-pink"
            />
            <FeatureCard
              icon={<GiTrophyCup />}
              title="6. Build Your Legacy"
              description="Track your horses' stats, total wins, and career earnings. Every race updates your horse's performance history!"
              color="text-neon-purple"
            />
          </div>
        </section>

        <section className="mb-16 glass p-8 rounded-2xl border border-neon-purple/30 shadow-neon-purple">
          <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
            <IoSpeedometer className="text-neon-orange" />
            Race Mechanics
          </h2>
          <p className="text-gray-300 text-lg mb-6 leading-relaxed">
            Every race is divided into <span className="text-neon-yellow font-semibold">10 segments</span>,
            each representing 10% of the track. Horse speed varies dynamically based on their unique attributes
            and the current segment, creating unpredictable and exciting races!
          </p>

          <h3 className="text-2xl font-bold mb-4 text-neon-blue">Key Performance Factors</h3>
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <StatFactor
              icon={<GiAges />}
              title="Age"
              description="Younger horses (2-5 years) sprint faster in middle segments (40-70%). Horses over 15 years slow down in final segments due to fatigue."
              color="text-neon-blue"
            />
            <StatFactor
              icon={<GiWeightLiftingUp />}
              title="Weight"
              description="Optimal weight is 400-500kg. Heavier horses (700kg+) struggle uphill in segments 3-5 (30-50%). Light horses have better acceleration!"
              color="text-neon-green"
            />
            <StatFactor
              icon={<FaChartLine />}
              title="Determination"
              description="High determination (70+) provides a powerful speed boost in the final 3 segments. Never give up - champions are made in the homestretch!"
              color="text-neon-purple"
            />
            <StatFactor
              icon={<MdTimeline />}
              title="Level"
              description="Higher level horses have better base times: Level 3 targets 15 seconds, Level 2 targets 20 seconds, Level 1 targets 30 seconds."
              color="text-neon-pink"
            />
          </div>

          <div className="bg-gradient-to-r from-neon-blue/10 via-neon-purple/10 to-neon-pink/10 p-6 rounded-lg border border-neon-blue/20">
            <h4 className="text-xl font-bold mb-3 flex items-center gap-2">
              <FaBolt className="text-neon-yellow" />
              Dynamic Racing System
            </h4>
            <ul className="space-y-2 text-gray-300">
              <li className="flex items-start gap-2">
                <span className="text-neon-green mt-1">•</span>
                <span><strong>Segment-based progression:</strong> Each segment has unique timing based on horse attributes and race conditions</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-neon-green mt-1">•</span>
                <span><strong>Real-time updates:</strong> Position calculated and broadcast every 100ms for smooth, live racing action</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-neon-green mt-1">•</span>
                <span><strong>Unpredictable outcomes:</strong> Small randomness in each segment ensures no two races are identical</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-neon-green mt-1">•</span>
                <span><strong>Fair competition:</strong> All calculations happen server-side to prevent manipulation</span>
              </li>
            </ul>
          </div>
        </section>

        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8 flex items-center gap-3">
            <FaChartLine className="text-neon-pink" />
            Horse Stats Explained
          </h2>

          <div className="glass p-8 rounded-2xl border border-neon-pink/30 shadow-neon-pink mb-6">
            <div className="mb-6">
              <h3 className="text-2xl font-bold mb-4 text-neon-yellow flex items-center gap-2">
                <MdSpeed />
                Understanding Race Performance
              </h3>
              <p className="text-gray-300 text-lg leading-relaxed mb-4">
                Every horse in Pixel Race has unique stats that determine their race performance. Each stat has an <span className="text-neon-blue font-semibold">optimal value</span> -
                the closer your horse is to this optimal point, the faster they run! Stats that are too low OR too high will slow your horse down.
              </p>
              <div className="bg-gradient-to-r from-neon-orange/10 to-neon-pink/10 p-4 rounded-lg border border-neon-orange/20">
                <p className="text-sm text-gray-300">
                  <FaBolt className="inline text-neon-yellow mr-2" />
                  <strong>Important:</strong> Not all stats affect race speed! Some stats grow through racing experience and bond with your horse.
                </p>
              </div>
            </div>

            <div className="grid gap-6">
              <div>
                <h4 className="text-xl font-bold mb-4 text-neon-green flex items-center gap-2">
                  ⚡ Stats That Affect Race Speed
                </h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-white/5 p-5 rounded-lg border border-neon-blue/20 hover:border-neon-blue/40 transition-all">
                    <div className="flex items-center gap-3 mb-3">
                      <GiAges className="text-3xl text-neon-blue" />
                      <div>
                        <h5 className="text-lg font-bold">Age</h5>
                        <p className="text-xs text-gray-400">Range: 1-10 years</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-300 mb-2">
                      Determined by birth date. Ages automatically as calendar time passes.
                    </p>
                    <div className="bg-neon-blue/10 p-3 rounded border border-neon-blue/20 text-sm">
                      <p className="text-gray-300">
                        <strong className="text-neon-blue">Optimal:</strong> Mid-age horses perform best. Very young or very old horses are slower.
                      </p>
                    </div>
                  </div>

                  <div className="bg-white/5 p-5 rounded-lg border border-neon-green/20 hover:border-neon-green/40 transition-all">
                    <div className="flex items-center gap-3 mb-3">
                      <GiWeightLiftingUp className="text-3xl text-neon-green" />
                      <div>
                        <h5 className="text-lg font-bold">Weight</h5>
                        <p className="text-xs text-gray-400">Range: 300-1000 kg</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-300 mb-2">
                      Fixed at birth. Represents your horse's natural build and muscle mass.
                    </p>
                    <div className="bg-neon-green/10 p-3 rounded border border-neon-green/20 text-sm">
                      <p className="text-gray-300">
                        <strong className="text-neon-green">Optimal:</strong> Medium weight provides best balance. Too light or too heavy reduces speed.
                      </p>
                    </div>
                  </div>

                  <div className="bg-white/5 p-5 rounded-lg border border-neon-yellow/20 hover:border-neon-yellow/40 transition-all">
                    <div className="flex items-center gap-3 mb-3">
                      <FaUtensils className="text-3xl text-neon-yellow" />
                      <div>
                        <h5 className="text-lg font-bold">Satiety</h5>
                        <p className="text-xs text-gray-400">Range: 0-100</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-300 mb-2">
                      Starts at 100 when purchased. Decreases by 10 after each race. Restore by feeding your horse.
                    </p>
                    <div className="bg-neon-yellow/10 p-3 rounded border border-neon-yellow/20 text-sm">
                      <p className="text-gray-300">
                        <strong className="text-neon-yellow">Optimal:</strong> Moderately full horses run fastest. Starving or overfed horses are slower.
                      </p>
                    </div>
                  </div>

                  <div className="bg-white/5 p-5 rounded-lg border border-neon-purple/20 hover:border-neon-purple/40 transition-all">
                    <div className="flex items-center gap-3 mb-3">
                      <FaDumbbell className="text-3xl text-neon-purple" />
                      <div>
                        <h5 className="text-lg font-bold">Determination</h5>
                        <p className="text-xs text-gray-400">Range: 0-100</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-300 mb-2">
                      Random value assigned at birth (30-70). Can be improved through training (coming soon).
                    </p>
                    <div className="bg-neon-purple/10 p-3 rounded border border-neon-purple/20 text-sm">
                      <p className="text-gray-300">
                        <strong className="text-neon-purple">Optimal:</strong> Higher is better. Maximum determination provides best performance.
                      </p>
                    </div>
                  </div>

                  <div className="bg-white/5 p-5 rounded-lg border border-pink-500/20 hover:border-pink-500/40 transition-all">
                    <div className="flex items-center gap-3 mb-3">
                      <FaHeart className="text-3xl text-pink-500" />
                      <div>
                        <h5 className="text-lg font-bold">Bond</h5>
                        <p className="text-xs text-gray-400">Range: 0-100</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-300 mb-2">
                      Starts at 0. Increases by <span className="text-pink-500 font-semibold">+2</span> after every race.
                      <span className="text-neon-orange font-semibold"> Resets to 0 if horse is sold!</span>
                    </p>
                    <div className="bg-pink-500/10 p-3 rounded border border-pink-500/20 text-sm">
                      <p className="text-gray-300">
                        <strong className="text-pink-500">Optimal:</strong> Higher bond = faster horse. Build trust through racing together!
                      </p>
                    </div>
                  </div>

                  <div className="bg-white/5 p-5 rounded-lg border border-purple-400/20 hover:border-purple-400/40 transition-all">
                    <div className="flex items-center gap-3 mb-3">
                      <FaTrophy className="text-3xl text-purple-400" />
                      <div>
                        <h5 className="text-lg font-bold">Fame</h5>
                        <p className="text-xs text-gray-400">Range: 0-100</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-300 mb-2">
                      Starts at 0. Increases based on race results:
                      <span className="block mt-1">
                        🥇 1st place: <span className="text-neon-yellow font-semibold">+3</span> |
                        🥈 2nd place: <span className="text-gray-300 font-semibold">+2</span> |
                        🥉 3rd place: <span className="text-amber-600 font-semibold">+1</span>
                      </span>
                    </p>
                    <div className="bg-purple-400/10 p-3 rounded border border-purple-400/20 text-sm">
                      <p className="text-gray-300">
                        <strong className="text-purple-400">Optimal:</strong> Higher fame = faster horse. Champions run with confidence!
                      </p>
                    </div>
                  </div>

                  <div className="bg-white/5 p-5 rounded-lg border border-cyan-400/20 hover:border-cyan-400/40 transition-all">
                    <div className="flex items-center gap-3 mb-3">
                      <FaBrain className="text-3xl text-cyan-400" />
                      <div>
                        <h5 className="text-lg font-bold">Instinct</h5>
                        <p className="text-xs text-gray-400">Range: 0-100</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-300 mb-2">
                      Random initial value (0-30) at birth. After each race, <span className="text-cyan-400 font-semibold">20% chance</span> to
                      increase by <span className="text-cyan-400 font-semibold">+2</span>.
                    </p>
                    <div className="bg-cyan-400/10 p-3 rounded border border-cyan-400/20 text-sm">
                      <p className="text-gray-300">
                        <strong className="text-cyan-400">Optimal:</strong> Higher instinct = faster horse. Natural racing intelligence matters!
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-xl font-bold mb-4 text-gray-400 flex items-center gap-2">
                  ℹ️ Stats That DON'T Affect Race Speed
                </h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-white/5 p-5 rounded-lg border border-gray-500/20">
                    <div className="flex items-center gap-3 mb-3">
                      <FaBolt className="text-3xl text-gray-400" />
                      <div>
                        <h5 className="text-lg font-bold text-gray-300">Energy</h5>
                        <p className="text-xs text-gray-500">Range: 0-100</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-400 mb-2">
                      Starts at 100. Decreases by 10 after each race. Must be above 0 to race. Restore by resting your horse.
                    </p>
                    <div className="bg-gray-500/10 p-3 rounded border border-gray-500/20 text-sm">
                      <p className="text-gray-400">
                        <strong>Note:</strong> Energy prevents exhaustion but doesn't affect speed. Keep it above 0 to race!
                      </p>
                    </div>
                  </div>

                  <div className="bg-white/5 p-5 rounded-lg border border-gray-500/20">
                    <div className="flex items-center gap-3 mb-3">
                      <FaTrophy className="text-3xl text-gray-400" />
                      <div>
                        <h5 className="text-lg font-bold text-gray-300">Level</h5>
                        <p className="text-xs text-gray-500">Values: 1, 2, or 3</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-400 mb-2">
                      Determined at purchase. Affects which races you can enter and sets base race time targets, but doesn't directly modify speed.
                    </p>
                    <div className="bg-gray-500/10 p-3 rounded border border-gray-500/20 text-sm">
                      <p className="text-gray-400">
                        <strong>Note:</strong> Level determines race eligibility, not performance. A well-trained Level 1 can compete!
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-neon-blue/10 via-neon-purple/10 to-neon-pink/10 p-6 rounded-lg border border-neon-blue/20">
                <h4 className="text-xl font-bold mb-3 flex items-center gap-2">
                  <FaBolt className="text-neon-yellow" />
                  How Optimal Values Work
                </h4>
                <p className="text-gray-300 mb-3">
                  Each performance stat (Age, Weight, Satiety, Determination, Bond, Fame, Instinct) has a hidden <span className="text-neon-blue font-semibold">optimal value</span>.
                  Your horse's race time is calculated based on how close each stat is to its optimal:
                </p>
                <ul className="space-y-2 text-gray-300 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-neon-green mt-1">✓</span>
                    <span><strong className="text-neon-green">At optimal:</strong> No time penalty - your horse runs at peak performance</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-neon-yellow mt-1">⚠</span>
                    <span><strong className="text-neon-yellow">Near optimal:</strong> Small time penalty - still competitive</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-neon-orange mt-1">⚠</span>
                    <span><strong className="text-neon-orange">Far from optimal:</strong> Large time penalty - significant slowdown</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-neon-pink mt-1">✕</span>
                    <span><strong className="text-neon-pink">At minimum/maximum:</strong> Maximum penalty - worst performance</span>
                  </li>
                </ul>
                <p className="text-gray-400 text-sm mt-4 italic">
                  💡 Strategy tip: Focus on improving stats that are furthest from optimal for maximum speed gains!
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
            <MdDeveloperMode className="text-neon-green" />
            Development Status
          </h2>
          <div className="glass p-8 rounded-2xl border border-neon-green/30">
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-3 h-3 bg-neon-yellow rounded-full animate-pulse-slow"></div>
                <h3 className="text-2xl font-bold text-neon-yellow">Alpha Stage - Devnet</h3>
              </div>
              <p className="text-gray-300 text-lg leading-relaxed">
                Pixel Race is currently in early development and running on Solana Devnet. This means you can
                play with test SOL (free from faucets) and help us test the game mechanics before mainnet launch!
              </p>
            </div>

            <h4 className="text-xl font-bold mb-4 text-neon-purple">Upcoming Features</h4>
            <div className="grid md:grid-cols-2 gap-3">
              {[
                'Horse breeding system - Create offspring with combined traits',
                'Training mechanics - Improve stats through focused training',
                'Tournament system - Compete in scheduled events for bigger prizes',
                'Global leaderboards - Track top horses and trainers',
                'Horse marketplace - Buy, sell, and trade NFT horses',
                'Mobile application - Race on the go',
                'Mainnet launch - Real SOL prizes and NFT ownership',
                'Staking rewards - Earn passive income with your horses'
              ].map((feature, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                  <div className="w-2 h-2 bg-neon-green rounded-full"></div>
                  <span className="text-gray-300">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8 flex items-center gap-3">
            <MdTimeline className="text-neon-yellow" />
            Product Roadmap
          </h2>
          <div className="glass p-8 rounded-2xl border border-white/10">
            <p className="text-gray-300 text-lg leading-relaxed mb-8 text-center max-w-3xl mx-auto">
              Our vision is to create the most engaging and fair Web3 horse racing experience. Here&apos;s what we&apos;re building:
            </p>

            <div className="max-w-4xl mx-auto">
              <RoadmapPhase
                phase="Phase 1: Foundation"
                quarter="Q3 2025"
                status="completed"
                statusLabel="COMPLETED"
                items={[
                  { icon: <GiHorseHead />, text: 'Basic horse NFT minting system' },
                  { icon: <IoTime />, text: 'Real-time race engine with Socket.io' },
                  { icon: <FaCoins />, text: 'SOL-based payment integration' },
                  { icon: <SiSolana />, text: 'Wallet authentication (Phantom, Solflare)' },
                  { icon: <FaTrophy />, text: '3-level horse system' },
                  { icon: <BsCurrencyExchange />, text: 'Prize pool distribution' }
                ]}
              />

              <RoadmapPhase
                phase="Phase 2: Core Gameplay"
                quarter="Q4 2025"
                status="in-progress"
                statusLabel="IN PROGRESS"
                items={[
                  { icon: <GiHorseshoe />, text: 'Horse breeding mechanics (coming soon)' },
                  { icon: <FaChartLine />, text: 'Stat training system (coming soon)' },
                  { icon: <GiTrophyCup />, text: 'Tournament system (coming soon)' },
                  { icon: <FaTrophy />, text: 'Leaderboards and rankings (coming soon)' },
                  { icon: <FaShoppingCart />, text: 'Horse marketplace (coming soon)' },
                  { icon: <FaGamepad />, text: 'Mobile responsive design improvements (in progress)', highlight: true }
                ]}
              />

              <RoadmapPhase
                phase="Phase 3: Token Economy"
                quarter="Q1 2026"
                status="planned"
                statusLabel="PLANNED"
                items={[
                  { icon: <GiToken />, text: 'Token Launch - Native game token on Solana'},
                  { icon: <FaCoins />, text: 'Token-based race entry - Use our token instead of SOL' },
                  { icon: <FaShoppingCart />, text: 'Token-based horse purchases - Buy horses with token' },
                  { icon: <FaChartLine />, text: 'Staking rewards - Stake token to earn passive income' },
                  { icon: <RiAuctionLine />, text: 'Live Betting System - Bet on horses during races with token'},
                  { icon: <FaBolt />, text: 'In-race power-ups - Use tokens to boost your horse mid-race' },
                  { icon: <RiGovernmentLine />, text: 'Community governance - Vote on game features with token' }
                ]}
              />

              <RoadmapPhase
                phase="Phase 4: Advanced Features"
                quarter="Q2 2026"
                status="future"
                statusLabel="FUTURE"
                items={[
                  { icon: <FaUsers />, text: 'Jockey System - Hire NFT jockeys with unique abilities'},
                  { icon: <FaChartLine />, text: 'Advanced horse attributes - Stamina, intelligence, adaptability' },
                  { icon: <IoTime />, text: 'Weather & track conditions - Dynamic race environments' },
                  { icon: <GiHorseshoe />, text: 'Horse equipment & gear - Saddles, shoes, accessories as NFTs' },
                  { icon: <FaUsers />, text: 'Guilds & team competitions - Compete with your stable' },
                  { icon: <SiSolana />, text: 'Mainnet migration - Real SOL prizes on mainnet'},
                  { icon: <BsGlobe2 />, text: 'Cross-chain integration - Bridge to other blockchains' },
                  { icon: <FaGamepad />, text: '3D race visualization - Upgraded graphics engine' }
                ]}
              />
            </div>

            <div className="mt-8 p-6 bg-gradient-to-r from-neon-blue/10 via-neon-purple/10 to-neon-pink/10 rounded-lg border border-neon-blue/20 text-center">
              <p className="text-gray-300 text-sm leading-relaxed">
                <FaBolt className="inline text-neon-yellow mr-2" />
                Roadmap is subject to change based on community feedback and market conditions
              </p>
            </div>
          </div>
        </section>

        <section className="text-center glass p-8 rounded-2xl border border-neon-pink/30">
          <h2 className="text-3xl font-bold mb-4">Ready to Race?</h2>
          <p className="text-gray-300 text-lg mb-6 max-w-2xl mx-auto">
            Connect your Solana wallet, grab some test SOL from the faucet, and join the revolution
            in blockchain gaming. The track awaits!
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/"
              className="bg-gradient-to-r from-neon-blue to-neon-purple px-8 py-3 rounded-lg font-semibold hover:scale-105 transition-all duration-300 shadow-neon"
            >
              Start Racing
            </Link>
            <Link
              href="/mystery-box"
              className="bg-gradient-to-r from-neon-yellow to-neon-orange px-8 py-3 rounded-lg font-semibold hover:scale-105 transition-all duration-300 shadow-neon-pink"
            >
              Buy Your First Horse
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
