
import { Connection, PublicKey } from "@solana/web3.js";
import { lamportsToSol } from "./solana-transactions";

export async function checkSufficientBalance(
  connection: Connection,
  publicKey: PublicKey,
  requiredAmount: number,
  estimatedFee: number = 0.000005,
): Promise<{ sufficient: boolean; balance: number; required: number }> {
  try {
    const balanceLamports = await connection.getBalance(publicKey);
    const balance = lamportsToSol(balanceLamports);
    const required = requiredAmount + estimatedFee;

    return {
      sufficient: balance >= required,
      balance,
      required,
    };
  } catch (error) {
    console.error("Error checking balance:", error);
    return {
      sufficient: false,
      balance: 0,
      required: requiredAmount + estimatedFee,
    };
  }
}

export function getTransactionErrorMessage(error: any): string {
  const errorStr = error?.message || error?.toString() || "";

  if (errorStr.includes("insufficient")) {
    return "Insufficient SOL balance for this transaction. Please add more SOL to your wallet.";
  }

  if (
    errorStr.includes("User rejected") ||
    errorStr.includes("user rejected")
  ) {
    return "Transaction cancelled by user.";
  }

  if (errorStr.includes("blockhash")) {
    return "Transaction expired. Please try again.";
  }

  if (errorStr.includes("timeout")) {
    return "Transaction confirmation timeout. It may still succeed - check your wallet.";
  }

  if (errorStr.includes("429")) {
    return "Too many requests. Please wait a moment and try again.";
  }

  return "Transaction failed. Please try again or contact support.";
}

export function formatSolAmount(sol: number): string {
  if (sol < 0.001) {
    return sol.toFixed(6);
  }
  if (sol < 1) {
    return sol.toFixed(4);
  }
  return sol.toFixed(2);
}

export function getExplorerUrl(signature: string, network: string): string {
  const cluster = network === "mainnet-beta" ? "" : `?cluster=${network}`;
  return `https://explorer.solana.com/tx/${signature}${cluster}`;
}
