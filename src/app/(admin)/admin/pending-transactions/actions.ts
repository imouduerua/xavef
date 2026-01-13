
'use client';

import { getFunctions, httpsCallable } from "firebase/functions";
import type { FirebaseApp } from "firebase/app";

/**
 * Calls a Firebase Callable Function to update the status of a transaction.
 * This is a client-side function.
 *
 * @param app The Firebase App instance.
 * @param transactionPath The full path to the transaction document in Firestore.
 * @param newStatus The new status to set for the transaction ('Completed' or 'Failed').
 * @returns An object indicating success or failure with an optional error message.
 */
export async function updateTransactionStatus(
  app: FirebaseApp,
  transactionPath: string,
  newStatus: 'Completed' | 'Failed'
): Promise<{ success: boolean; error?: string }> {
  
  const functions = getFunctions(app);
  const updateStatusCallable = httpsCallable(functions, 'updateTransactionStatus');

  try {
    const result: any = await updateStatusCallable({ transactionPath, newStatus });
    
    if (result.data.success) {
      return { success: true };
    } else {
      console.error('[ACTION FAILED] Callable function returned an error:', result.data.error);
      return { success: false, error: result.data.error };
    }
  } catch (error: any) {
    console.error('[ACTION CRASH] Error calling updateTransactionStatus function:', error);
    return { success: false, error: error.message || 'An unknown error occurred when calling the backend function.' };
  }
}
