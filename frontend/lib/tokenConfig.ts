export type Phase = 'live' | 'phase-1' | 'phase-2' | 'phase-3';

export interface TokenomicsSlice {
  label: string;
  pct: number;
  color: string;
}

export interface RoadmapPhase {
  key: Phase;
  title: string;
  eta: string;
  status: 'done' | 'in-progress' | 'planned';
  milestones: string[];
}

export interface Utility {
  id: string;
  icon: string;
  title: string;
  tagline: string;
  description: string;
  phase: Phase;
  accentColor: string;
}

export interface FaqItem {
  q: string;
  a: string;
}

function defaultLaunchDate(): string {
  const d = new Date();
  d.setUTCHours(d.getUTCHours() - 1);
  return d.toISOString();
}

export const SNAPSHOT_WINDOW_MS = 24 * 60 * 60 * 1000;
export const PHASE_1_OFFSET_MS = 7 * 24 * 60 * 60 * 1000;
export const PHASE_2_OFFSET_MS = 30 * 24 * 60 * 60 * 1000;
export const PHASE_3_OFFSET_MS = 90 * 24 * 60 * 60 * 1000;

export function getLaunchMs(): number {
  return new Date(TOKEN_CONFIG.launchDateISO).getTime();
}

export function isTokenLaunched(): boolean {
  return getLaunchMs() <= Date.now();
}

export function getPhaseStartISO(phase: 'phase-1' | 'phase-2' | 'phase-3'): string {
  const offset =
    phase === 'phase-1' ? PHASE_1_OFFSET_MS : phase === 'phase-2' ? PHASE_2_OFFSET_MS : PHASE_3_OFFSET_MS;
  return new Date(getLaunchMs() + offset).toISOString();
}

export function getSnapshotDeadlineISO(): string {
  return new Date(getLaunchMs() + SNAPSHOT_WINDOW_MS).toISOString();
}

export function isSnapshotWindowOpen(): boolean {
  return Date.now() < getLaunchMs() + SNAPSHOT_WINDOW_MS;
}

export const TOKEN_CONFIG = {
  ticker: 'PXL',
  displayTicker: '$PXL',
  name: 'Pixel Race Token',
  tagline: 'Fuel for the fastest NFT horses on Solana',

  launchDateISO: defaultLaunchDate(),
  totalSupply: 1_000_000_000,

  social: {
    twitter: 'https://twitter.com/pixelrace',
    discord: 'https://discord.gg/pixelrace',
    telegram: 'https://t.me/pixelrace',
    pumpFun: '',
  },

  liveStats: {
    horsesMinted: 34,
    solDistributed: 2.35,
    racers: 56,
  },

  tokenomics: [
    { label: 'Pump.fun Bonding Curve', pct: 80, color: '#00d9ff' },
    { label: 'Staking & Treasury', pct: 10, color: '#b537ff' },
    { label: 'Team (12mo lock)', pct: 5, color: '#ff2e97' },
    { label: 'Marketing & Airdrops', pct: 5, color: '#ffdd00' },
  ] as TokenomicsSlice[],

  fairLaunchBadges: [
    'No presale',
    'LP auto-burned',
    'No team allocation upfront',
    'Renounced mint authority',
  ],

  utilities: [
    {
      id: 'reward-multiplier',
      icon: '🏆',
      title: 'Race Reward Multiplier',
      tagline: 'Win bigger with every race',
      description:
        'Hold 1K / 10K / 100K $PXL in your wallet to unlock a permanent +5% / +15% / +30% bonus on every SOL prize you win.',
      phase: 'phase-1',
      accentColor: '#00d9ff',
    },
    {
      id: 'stake-to-earn',
      icon: '💎',
      title: 'Stake-to-Earn',
      tagline: 'Passive SOL, from the treasury',
      description:
        'Stake $PXL and receive a daily SOL drip funded by in-game fees. Est. APY ~84% based on current race volume.',
      phase: 'phase-1',
      accentColor: '#b537ff',
    },
    {
      id: 'holder-only-races',
      icon: '🔒',
      title: 'Holder-Only Races',
      tagline: 'Exclusive high-stakes events',
      description:
        'Enter token-gated races with bigger prize pools and fewer competitors. Minimum 10K $PXL to qualify.',
      phase: 'phase-1',
      accentColor: '#ff2e97',
    },
    {
      id: 'legendary-tier-4',
      icon: '🐴',
      title: 'Legendary Tier 4 Horse',
      tagline: 'Rarest breed, holders only',
      description:
        'A new horse class with top-tier stats. Purchasable for 5 SOL + 50K $PXL exclusively by $PXL holders.',
      phase: 'phase-2',
      accentColor: '#ffdd00',
    },
    {
      id: 'revenue-share',
      icon: '🔥',
      title: 'Revenue Share & Burn',
      tagline: 'The flywheel',
      description:
        'A share of all in-game fees flows back to stakers. The rest is auto-burned — live burn ticker on this page.',
      phase: 'phase-2',
      accentColor: '#ff6b00',
    },
    {
      id: 'breeding',
      icon: '🧬',
      title: 'Horse Breeding',
      tagline: 'Create your own bloodline',
      description:
        'Combine two horses + $PXL to mint a new horse with inherited genetics. Rare traits = rarer offspring.',
      phase: 'phase-3',
      accentColor: '#00ff88',
    },
  ] as Utility[],

  roadmap: [
    {
      key: 'live',
      title: 'Phase 0 — Launch',
      eta: 'Live now',
      status: 'done',
      milestones: [
        'Fair launch on Pump.fun',
        'LP auto-burned',
        'Snapshot at T+24h for OG Racer NFT airdrop',
        'Live race rewards already flowing on mainnet',
      ],
    },
    {
      key: 'phase-1',
      title: 'Phase 1 — Utility Unlock',
      eta: 'T + 7 days',
      status: 'in-progress',
      milestones: [
        'Race reward multiplier live on-chain',
        'Stake-to-Earn contract deployed',
        'First holder-only race event',
        'Holder leaderboard on /token',
      ],
    },
    {
      key: 'phase-2',
      title: 'Phase 2 — Economy Deepens',
      eta: 'T + 30 days',
      status: 'planned',
      milestones: [
        'Legendary Tier 4 horse drop',
        'Revenue share dividends activated',
        'Live burn ticker',
        'First quarterly treasury report',
      ],
    },
    {
      key: 'phase-3',
      title: 'Phase 3 — Breed & Expand',
      eta: 'T + 90 days',
      status: 'planned',
      milestones: [
        'Horse breeding system',
        'Genetics marketplace',
        'Cross-season tournaments',
        'CEX listing target',
      ],
    },
  ] as RoadmapPhase[],

  earlyBird: [
    { tier: 'Bronze', cutoff: 'First 10,000 holders', color: '#cd7f32', icon: '🥉' },
    { tier: 'Silver', cutoff: 'First 1,000 holders', color: '#c0c0c0', icon: '🥈' },
    { tier: 'Gold', cutoff: 'First 100 holders', color: '#ffd700', icon: '🥇' },
  ],

  stakeDefaults: {
    apy: 0.84,
    treasuryShareOfSupply: 0.1,
    sampleDailySolPool: 6.5,
  },

  rewardBoosterTiers: [
    { holding: 1_000, bonusPct: 5 },
    { holding: 10_000, bonusPct: 15 },
    { holding: 100_000, bonusPct: 30 },
  ],

  faq: [
    {
      q: 'Is $PXL live?',
      a: 'Yes — $PXL is live on Pump.fun right now. Use the "Buy on Pump.fun" button at the top of this page. Fair launch, no presale, no insider allocation.',
    },
    {
      q: 'What is the total supply?',
      a: '1,000,000,000 $PXL. 80% on Pump.fun bonding curve, 10% treasury/staking, 5% team (12-month lock), 5% marketing/airdrops.',
    },
    {
      q: 'Is this audited?',
      a: 'Staking and multiplier contracts go to independent audit in Phase 1 before mainnet deployment. Launch itself uses Pump.fun\'s public infrastructure.',
    },
    {
      q: 'When does staking go live?',
      a: 'Phase 1 — rolling out within 7 days of launch. Early stakers earn a boosted APY during the first 14 days.',
    },
    {
      q: 'What do I get for holding at launch?',
      a: 'A snapshot is taken at launch + 24h. Every wallet holding at least 1K $PXL receives a free OG Racer NFT + Bronze/Silver/Gold badge based on rank.',
    },
    {
      q: 'Do I need $PXL to play?',
      a: 'No. You can race with SOL alone. Holding $PXL stacks rewards on top — the game remains open to everyone.',
    },
    {
      q: 'How is this different from other pump.fun coins?',
      a: 'The game already exists, is live on mainnet, and is paying real SOL rewards every day. $PXL plugs into an existing economy — not a promise of one.',
    },
    {
      q: 'Where can I get help?',
      a: 'Discord and Telegram links above. Team is active daily.',
    },
  ] as FaqItem[],
};

export type TokenConfig = typeof TOKEN_CONFIG;
