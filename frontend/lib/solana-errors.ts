export function parseTransactionError(error: any): string {
  const errorName = error?.name || '';
  const message = (error?.message || '').toLowerCase();
  const errorString = String(error).toLowerCase();

  if (errorName === 'WalletNotConnectedError' || message.includes('wallet not connected') || message.includes('not connected')) {
    return 'Wallet not connected. Please connect your wallet and try again.';
  }

  if (errorName === 'WalletSignTransactionError' || message.includes('user rejected') || message.includes('user cancelled') || message.includes('user denied')) {
    return 'Transaction was rejected. Please approve the transaction in your wallet.';
  }

  if (errorName === 'WalletSendTransactionError') {
    const innerError = error?.error || error?.cause;
    const innerMessage = innerError ? String(innerError).toLowerCase() : '';
    const combinedMessage = message + ' ' + innerMessage;

    if (combinedMessage.includes('insufficient') || combinedMessage.includes('not enough') || combinedMessage.includes('0x1')) {
      return 'Insufficient SOL balance. Please add more SOL to your wallet to cover the transaction amount and network fees.';
    }

    if (combinedMessage.includes('simulation failed')) {
      return 'Transaction simulation failed. You may have insufficient funds or the transaction amount is invalid.';
    }

    if (combinedMessage.includes('blockhash') || combinedMessage.includes('expired') || combinedMessage.includes('not found')) {
      return 'Transaction expired. Network was too slow to process it. Please try again.';
    }

    if (combinedMessage.includes('timeout') || combinedMessage.includes('timed out')) {
      return 'Transaction timed out waiting for network confirmation. It may still succeed - check Solana Explorer.';
    }

    if (combinedMessage.includes('unexpected error')) {
      return 'Unexpected wallet error. This may be due to insufficient balance, wallet connection issues, or network problems. Please verify your balance and try again.';
    }

    return 'Wallet failed to send transaction. Please check your wallet connection, ensure you have sufficient balance, and try again.';
  }

  if (message.includes('insufficient funds') || message.includes('insufficient balance') || message.includes('not enough')) {
    return 'Insufficient SOL balance. Please add more SOL to your wallet to cover the transaction amount and network fees.';
  }

  if (message.includes('blockhash not found') || message.includes('blockhash expired')) {
    return 'Transaction expired. Network was too slow to process it. Please try again.';
  }

  if (message.includes('timeout') || message.includes('timed out')) {
    return 'Transaction timed out waiting for network confirmation. It may still succeed - check Solana Explorer.';
  }

  if (message.includes('simulation failed') || message.includes('0x1')) {
    return 'Transaction simulation failed. You may have insufficient funds or the transaction amount is invalid.';
  }

  if (message.includes('network') || message.includes('connection') || message.includes('fetch')) {
    return 'Network error. Please check your internet connection and try again.';
  }

  if (message.includes('invalid signature')) {
    return 'Invalid transaction signature. Please try again.';
  }

  if (message.includes('unexpected error')) {
    return 'Unexpected wallet error occurred. Please reconnect your wallet and try again.';
  }

  return error?.message || errorString || 'Transaction failed. Please try again.';
}

export function getErrorSeverity(error: any): 'warning' | 'error' {
  const errorName = error?.name || '';
  const message = (error?.message || '').toLowerCase();

  if (errorName === 'WalletSignTransactionError' || message.includes('user rejected') || message.includes('user cancelled') || message.includes('user denied')) {
    return 'warning';
  }

  return 'error';
}
