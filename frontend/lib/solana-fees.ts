import { Connection, Transaction, VersionedTransaction } from '@solana/web3.js';

const LAMPORTS_PER_SOL = 1_000_000_000;

export function lamportsToSol(lamports: number): number {
  return lamports / LAMPORTS_PER_SOL;
}

export function solToLamports(sol: number): number {
  return Math.floor(sol * LAMPORTS_PER_SOL);
}

export async function estimateTransactionFee(
  connection: Connection,
  transaction: Transaction | VersionedTransaction
): Promise<number> {
  try {
    const { blockhash } = await connection.getLatestBlockhash('confirmed');

    if (transaction instanceof Transaction) {
      transaction.recentBlockhash = blockhash;
      const message = transaction.compileMessage();
      const response = await connection.getFeeForMessage(message, 'confirmed');
      return response.value || 5000;
    } else {
      const response = await connection.getFeeForMessage(transaction.message, 'confirmed');
      return response.value || 5000;
    }
  } catch (error) {
    console.warn('Failed to estimate transaction fee:', error);
    return 5000;
  }
}

export function formatSOL(sol: number, decimals: number = 6): string {
  return sol.toFixed(decimals);
}

export function formatSOLWithSymbol(sol: number, decimals: number = 6): string {
  return `${formatSOL(sol, decimals)} SOL`;
}
