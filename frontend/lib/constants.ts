import { getHorseCarePrice } from './game-config';

export const HORSE_FEED_PRICE = getHorseCarePrice('feed');

export const HORSE_REST_PRICE = getHorseCarePrice('rest');

export const HORSE_TRAIN_PRICE = getHorseCarePrice('train');

export const TREASURY_WALLET = process.env.NEXT_PUBLIC_TREASURY_WALLET || '';

export const LAMPORTS_PER_SOL = 1_000_000_000;
