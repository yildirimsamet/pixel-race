# Frontend Patterns
- **Kullanıcı açıkça istemediği sürece dokümantasyon oluşturma**
## HorseCard Component

`frontend/components/HorseCard.tsx`

**Amaç**: Merkezi at kartı component'i (5 variant).

### Variants

| Variant | Kullanım | Özellikler |
|---------|----------|------------|
| `default` | Stable sayfası | Tüm statlar + performance + level badge |
| `minimal` | RaceEndStatsModal | Sadece ikon + isim + yaş |
| `compact` | Gelecek özellikler | Küçük kart |
| `selectable` | Race join | Tıklanabilir + validation + disabled reason |
| `reveal` | Mystery box | Animasyonlu reveal |

### Kullanım

```typescript
import HorseCard from '@/components/HorseCard';

// Stable - Full details
<HorseCard horse={horse} variant="default" />

// Race join - Selectable
<HorseCard
  horse={horse}
  variant="selectable"
  onClick={() => handleJoin(horse.id)}
  disabled={horse.in_race}
  disabledReason="Already racing"
/>

// Stats modal - Minimal
<HorseCard horse={horse} variant="minimal" />
```

### Props

```typescript
interface HorseCardProps {
  horse: Horse;
  variant?: 'default' | 'compact' | 'selectable' | 'reveal' | 'minimal';
  onClick?: () => void;
  selected?: boolean;
  disabled?: boolean;
  disabledReason?: string;
  showStats?: boolean;
  showPerformance?: boolean;
  className?: string;
}
```

## Hooks

### useAuth

`frontend/hooks/useAuth.ts`

```typescript
const { user, login, logout, isLoading } = useAuth()

// Wallet login
await login(walletAddress, signature, message)
```

### useRaces

`frontend/hooks/useRaces.ts`

```typescript
const { races, isLoading, error, refetch } = useRaces('waiting')
```

### useTransaction

`frontend/hooks/useTransaction.ts`

```typescript
const { sendTransaction, isLoading, error } = useTransaction()

// At satın alma
const signature = await sendTransaction(
  createHorsePurchaseTransaction(connection, wallet, treasury, amount)
)
```

### useSolanaBalance

`frontend/hooks/useSolanaBalance.ts`

```typescript
const { balance, refetch } = useSolanaBalance(walletAddress)
```

### useRaceSocket

`frontend/hooks/useRaceSocket.ts`

```typescript
const {
  isConnected,
  raceState,
  joinRace,
  leaveRace
} = useRaceSocket(raceId)

// Race events
useEffect(() => {
  if (raceState?.status === 'racing') {
    // Update UI
  }
}, [raceState])
```

## API Client

`frontend/lib/api.ts`

```typescript
import { api } from '@/lib/api';

// Auth
const { access_token } = await api.auth.login(walletAddress, signature, message);

// Horses
const horses = await api.horses.getAll();
const horse = await api.horses.buyBox({ max_level: 2, transaction_signature });

// Races
const races = await api.races.getAll('waiting');
const result = await api.races.join(raceId, { horse_id, transaction_signature });
```

Auto-retry ve auth header injection içerir.

## Solana Transactions

`frontend/lib/solana-transactions.ts`

```typescript
import {
  createHorsePurchaseTransaction,
  createRaceEntryTransaction
} from '@/lib/solana-transactions';

// Horse purchase
const tx = createHorsePurchaseTransaction(
  connection,
  wallet.publicKey,
  treasuryPublicKey,
  level
);

// Race entry
const tx = createRaceEntryTransaction(
  connection,
  wallet.publicKey,
  treasuryPublicKey,
  entry_fee
);
```

## Wallet Provider

`frontend/components/WalletProvider.tsx`

Solana wallet setup (Phantom, Solflare).

```typescript
import { WalletProvider } from '@/components/WalletProvider';
import { useWallet } from '@solana/wallet-adapter-react';

// App.tsx
<WalletProvider>
  <YourApp />
</WalletProvider>

// Component
const { connected, publicKey, signMessage } = useWallet();
```

## Environment Variables

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_SOCKET_URL=http://localhost:3000
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
```

## Patterns

### Error Handling

```typescript
try {
  const horse = await api.horses.buyBox({ max_level: 2, transaction_signature });
} catch (error) {
  if (error.response?.status === 400) {
    // Invalid transaction
  } else if (error.response?.status === 401) {
    // Unauthorized
  }
}
```

### Loading States

```typescript
const { data, isLoading, error } = useRaces('waiting');

if (isLoading) return <Spinner />;
if (error) return <ErrorMessage error={error} />;
return <RaceList races={data} />;
```

### Transaction Flow

```typescript
const handleBuyHorse = async () => {
  try {
    // 1. Create transaction
    const tx = createHorsePurchaseTransaction(...);

    // 2. Send & confirm
    const signature = await sendTransaction(tx);

    // 3. Call backend
    const horse = await api.horses.buyBox({
      max_level: 2,
      transaction_signature: signature
    });

    // 4. Update UI
    refetchHorses();
  } catch (error) {
    console.error('Purchase failed:', error);
  }
};
```

## Type Safety

TypeScript interfaces backend modelleriyle senkronize:

```typescript
interface Horse {
  id: string;
  name: string;
  color: string;
  birthdate: string;
  age: number;
  in_race: boolean;
  nft_mint_address?: string;
  stats: HorseStats;
}

interface HorseStats {
  level: number;
  weight: number;
  determination: number;
  energy: number;
  satiety: number;
  bond: number;
  fame: number;
  instinct: number;
  total_races: number;
  total_wins: number;
  total_earnings: number;
}
```

Backend değişirse frontend type'ları güncelle!

## Performance

- Component memoization (`React.memo`)
- Callback memoization (`useCallback`, `useMemo`)
- Image optimization (Next.js `<Image>`)
- Code splitting (dynamic imports)

## Production Checklist

- [ ] Error boundary improvements
- [ ] Loading state UX improvements
- [ ] Transaction retry logic
- [ ] Explorer link integration
- [ ] Mobile responsiveness
- [ ] PWA support

Detaylar: [web3-integration.md](web3-integration.md)
