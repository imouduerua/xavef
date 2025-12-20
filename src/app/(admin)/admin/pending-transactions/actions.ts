
'use server';

// This file is intentionally left empty. 
// The data fetching logic was moved to the client-side to bypass a persistent
// server-side authentication issue.

export async function getPendingTransactionsAction(): Promise<{
  transactions: any[] | null;
  error?: string;
}> {
  return {
    transactions: null,
    error: 'This server action is deprecated.',
  };
}
