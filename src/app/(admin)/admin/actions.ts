
'use server';

import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from '@/firebase/client-provider'; // Corrected import

// This is a server action, so it's safe to use server-side Firebase logic.
const functions = getFunctions(app);
const updateTransactionStatusFn = httpsCallable(functions, 'updateTransactionStatus');

export async function handleTransactionUpdate(
  transactionPath: string,
  newStatus: 'Completed' | 'Failed'
): Promise<{ success: boolean; error?: string }> {

  try {
    const result = await updateTransactionStatusFn({ transactionPath, newStatus });
    const data = result.data as { success: boolean; error?: string; message?: string };

    if (data.success) {
      return { success: true };
    } else {
      // The callable function might return a specific error message
      return { success: false, error: data.error || 'The function returned an error.' };
    }
  } catch (error: any) {
    console.error('Error calling updateTransactionStatus function:', error);
    // The error object from a failed callable function has a 'message' property
    return { success: false, error: error.message || 'An unexpected error occurred on the server.' };
  }
}
