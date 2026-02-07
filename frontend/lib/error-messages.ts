
interface ErrorMapping {
  pattern: RegExp;
  message: string;
}

const errorMappings: ErrorMapping[] = [
  { pattern: /user rejected|user denied|user cancelled/i, message: 'Transaction cancelled by user' },
  { pattern: /insufficient funds|insufficient balance/i, message: 'Insufficient SOL balance in your wallet' },
  { pattern: /insufficient funds in treasury/i, message: 'System error: Treasury low. Please contact support.' },
  { pattern: /transaction failed|failed to send transaction/i, message: 'Transaction failed. Please try again.' },
  { pattern: /signature verification failed/i, message: 'Transaction signature invalid. Please try again.' },

  { pattern: /horse not found/i, message: 'Horse not found. It may have been removed.' },
  { pattern: /horse already in race|horse is in a race/i, message: 'This horse is already in another race' },
  { pattern: /horse (stats )?too low|energy too low|satiety too low/i, message: 'Horse is too tired or hungry. Feed and rest first.' },
  { pattern: /horse level too low/i, message: 'Horse level is too low for this race' },

  { pattern: /race not found/i, message: 'Race not found. It may have been cancelled.' },
  { pattern: /race (is )?full|max (horses|participants) reached/i, message: 'Race is full. Try another race.' },
  { pattern: /race (has )?already started|race is (in progress|racing)/i, message: 'Race has already started' },
  { pattern: /race (has )?ended|race (is )?finished/i, message: 'Race has already finished' },
  { pattern: /race cancelled/i, message: 'Race was cancelled due to insufficient participants' },
  { pattern: /race starts? (in|within) \d+ seconds?/i, message: 'Race starting soon. Join earlier next time.' },
  { pattern: /minimum horses not met/i, message: 'Not enough horses registered for this race' },

  { pattern: /not authenticated|authentication (required|failed)/i, message: 'Please connect your wallet to continue' },
  { pattern: /wallet not connected/i, message: 'Please connect your wallet first' },
  { pattern: /invalid (token|signature)/i, message: 'Session expired. Please reconnect your wallet.' },

  { pattern: /network (error|failed)|failed to fetch/i, message: 'Network error. Please check your connection.' },
  { pattern: /timeout|timed out/i, message: 'Request timed out. Please try again.' },
  { pattern: /server error|internal server error|500/i, message: 'Server error. Please try again later.' },
  { pattern: /service unavailable|503/i, message: 'Service temporarily unavailable. Please try again.' },

  { pattern: /invalid (input|data|parameter)/i, message: 'Invalid input. Please check your data.' },
  { pattern: /missing required (field|parameter)/i, message: 'Missing required information' },
  { pattern: /price mismatch|amount (mismatch|incorrect)/i, message: 'Price has changed. Please refresh and try again.' },

  { pattern: /rate limit|too many requests/i, message: 'Too many requests. Please wait a moment.' },

  { pattern: /failed to (feed|rest|train) horse/i, message: 'Action failed. Please try again.' },
  { pattern: /failed to (join|enter) race/i, message: 'Failed to join race. Please try again.' },
  { pattern: /failed to (buy|purchase)/i, message: 'Purchase failed. Please try again.' },
];

export function getUserFriendlyError(
  error: Error | string | any,
  fallback: string = 'An error occurred. Please try again.'
): string {
  let errorMessage = '';

  if (typeof error === 'string') {
    errorMessage = error;
  } else if (error?.response?.data?.detail) {
    errorMessage = error.response.data.detail;
  } else if (error?.response?.data?.message) {
    errorMessage = error.response.data.message;
  } else if (error?.message) {
    errorMessage = error.message;
  } else if (error?.error) {
    errorMessage = error.error;
  } else {
    return fallback;
  }

  for (const mapping of errorMappings) {
    if (mapping.pattern.test(errorMessage)) {
      return mapping.message;
    }
  }

  const technicalTerms = ['null', 'undefined', 'exception', 'stack', 'traceback', '500', '404', '403'];
  const hasTechnicalTerms = technicalTerms.some(term =>
    errorMessage.toLowerCase().includes(term)
  );

  if (!hasTechnicalTerms && errorMessage.length > 0 && errorMessage.length < 200) {
    return errorMessage;
  }

  return fallback;
}

export function extractErrorMessage(error: any): string {
  if (typeof error === 'string') return error;
  if (error?.response?.data?.detail) return error.response.data.detail;
  if (error?.response?.data?.message) return error.response.data.message;
  if (error?.message) return error.message;
  if (error?.error) return error.error;
  return 'Unknown error';
}
