
import {
  Connection,
  Transaction,
  SystemProgram,
  PublicKey,
  LAMPORTS_PER_SOL,
  TransactionInstruction,
} from "@solana/web3.js";
import {
  getHorsePrice,
  getHorseCarePrice,
  getGoodLuckPrice,
} from "./game-config";

const MEMO_PROGRAM_ID = new PublicKey(
  "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr",
);

export function solToLamports(sol: number): number {
  return Math.floor(sol * LAMPORTS_PER_SOL);
}

export function lamportsToSol(lamports: number): number {
  return lamports / LAMPORTS_PER_SOL;
}

export function createSolTransferTransaction(
  from: PublicKey,
  to: PublicKey,
  amountSOL: number,
  memo?: string,
): Transaction {
  const lamports = solToLamports(amountSOL);

  const transaction = new Transaction();

  transaction.feePayer = from;

  transaction.add(
    SystemProgram.transfer({
      fromPubkey: from,
      toPubkey: to,
      lamports: lamports,
    }),
  );

  if (memo) {
    transaction.add(
      new TransactionInstruction({
        keys: [],
        programId: MEMO_PROGRAM_ID,
        data: Buffer.from(memo, "utf-8"),
      }),
    );
  }

  return transaction;
}

export async function createHorsePurchaseTransaction(
  userPublicKey: PublicKey,
  treasuryWallet: string,
  priceSOL: number,
  level?: number,
): Promise<Transaction> {
  const treasuryPublicKey = new PublicKey(treasuryWallet);
  const levelText = level ? ` (Level ${level})` : "";
  const memo = `Pixel Race - Horse Purchase${levelText}`;
  return createSolTransferTransaction(
    userPublicKey,
    treasuryPublicKey,
    priceSOL,
    memo,
  );
}

export async function createRaceEntryTransaction(
  userPublicKey: PublicKey,
  treasuryWallet: string,
  entryFeeSOL: number,
): Promise<Transaction> {
  const treasuryPublicKey = new PublicKey(treasuryWallet);
  const memo = "Pixel Race - Race Entry Fee";
  return createSolTransferTransaction(
    userPublicKey,
    treasuryPublicKey,
    entryFeeSOL,
    memo,
  );
}

export async function confirmTransaction(
  connection: Connection,
  signature: string,
  commitment: "processed" | "confirmed" | "finalized" = "confirmed",
  maxAttempts: number = 60,
): Promise<boolean> {
  let attempts = 0;

  while (attempts < maxAttempts) {
    try {
      const status = await connection.getSignatureStatus(signature);

      if (
        status.value?.confirmationStatus === commitment ||
        status.value?.confirmationStatus === "finalized"
      ) {
        return true;
      }

      if (status.value?.err) {
        console.error("Transaction failed on blockchain:", status.value.err);
        return false;
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));
      attempts++;
    } catch (error) {
      console.error("Error checking transaction status:", error);
      attempts++;

      if (attempts % 10 === 0) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }
  }

  console.warn(`Transaction confirmation timeout after ${attempts} attempts`);
  return false;
}

export const HORSE_PRICES: Record<number, number> = {
  1: getHorsePrice(1),
  2: getHorsePrice(2),
  3: getHorsePrice(3),
};

export { getHorsePrice };

export function formatSOL(sol: number, decimals: number = 4): string {
  return `${sol.toFixed(decimals)} SOL`;
}

export function getExplorerUrl(
  signature: string,
  cluster: string = "devnet",
): string {
  return `https://explorer.solana.com/tx/${signature}?cluster=${cluster}`;
}

export async function createHorseFeedTransaction(
  userPublicKey: PublicKey,
  treasuryWallet: string,
): Promise<Transaction> {
  const treasuryPublicKey = new PublicKey(treasuryWallet);
  const feedPrice = getHorseCarePrice("feed");
  const memo = "Pixel Race - Feed Horse";
  return createSolTransferTransaction(
    userPublicKey,
    treasuryPublicKey,
    feedPrice,
    memo,
  );
}

export async function createHorseRestTransaction(
  userPublicKey: PublicKey,
  treasuryWallet: string,
): Promise<Transaction> {
  const treasuryPublicKey = new PublicKey(treasuryWallet);
  const restPrice = getHorseCarePrice("rest");
  const memo = "Pixel Race - Rest Horse";
  return createSolTransferTransaction(
    userPublicKey,
    treasuryPublicKey,
    restPrice,
    memo,
  );
}

export async function createHorseTrainTransaction(
  userPublicKey: PublicKey,
  treasuryWallet: string,
): Promise<Transaction> {
  const treasuryPublicKey = new PublicKey(treasuryWallet);
  const trainPrice = getHorseCarePrice("train");
  const memo = "Pixel Race - Train Horse";
  return createSolTransferTransaction(
    userPublicKey,
    treasuryPublicKey,
    trainPrice,
    memo,
  );
}

export const GOODLUCK_PRICE = getGoodLuckPrice();

export async function createGoodLuckPurchaseTransaction(
  userPublicKey: PublicKey,
  treasuryWallet: string,
  quantity: number,
): Promise<Transaction> {
  const tokenPrice = getGoodLuckPrice();
  const totalPrice = quantity * tokenPrice;
  const treasuryPublicKey = new PublicKey(treasuryWallet);
  const memo = `Pixel Race - GoodLuck Token Purchase (${quantity}x)`;
  return createSolTransferTransaction(
    userPublicKey,
    treasuryPublicKey,
    totalPrice,
    memo,
  );
}
