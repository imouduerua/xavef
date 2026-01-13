
'use server';

import { FieldValue } from 'firebase-admin/firestore';
import { firestore as adminFirestore } from '@/firebase/server-init';
import type { Transaction } from '@/lib/types';

/**
 * Updates the status of a transaction and adjusts user balances accordingly.
 * This is a server-only action using the Firebase Admin SDK.
 *
 * @param transactionPath The full path to the transaction document in Firestore.
 * @param newStatus The new status to set for the transaction ('Completed' or 'Failed').
 * @returns An object indicating success or failure with an optional error message.
 */
export async function updateTransactionStatus(
  transactionPath: string,
  newStatus: 'Completed' | 'Failed'
): Promise<{ success: boolean; error?: string }> {
  console.log(`[ACTION START] updateTransactionStatus: path=${transactionPath}, newStatus=${newStatus}`);

  if (!adminFirestore) {
    const errorMsg = 'Server is not configured for database access.';
    console.error(`[ACTION CRASH] ${errorMsg}`);
    return { success: false, error: errorMsg };
  }

  const transactionRef = adminFirestore.doc(transactionPath);
  const userRef = transactionRef.parent.parent;

  if (!userRef) {
    const errorMsg = 'Could not determine the user document from the transaction path.';
    console.error(`[ACTION CRASH] ${errorMsg}`);
    return { success: false, error: errorMsg };
  }

  try {
    await adminFirestore.runTransaction(async (t) => {
      console.log('[ACTION INFO] Starting Firestore transaction.');
      const [txDoc, userDoc] = await Promise.all([
        t.get(transactionRef),
        t.get(userRef),
      ]);
      
      if (!txDoc.exists) {
        throw new Error(`Transaction document not found at path: ${transactionPath}`);
      }
      if (!userDoc.exists) {
        throw new Error(`User document not found for this transaction.`);
      }
      
      const txData = txDoc.data() as Transaction;
      console.log('[ACTION INFO] Fetched transaction data:', txData);

      if (txData.status !== 'Pending') {
        throw new Error('This transaction has already been processed.');
      }

      // 1. Update the transaction status
      console.log(`[ACTION INFO] Updating transaction ${txDoc.id} status to ${newStatus}.`);
      t.update(transactionRef, { status: newStatus });

      // 2. If it completed, update user balance.
      if (newStatus === 'Completed') {
        const amount = txData.amount;
        console.log(`[ACTION INFO] Status is "Completed". Amount: ${amount}`);
        
        if (txData.type === 'Deposit') {
          const targetBalanceField = txData.targetAccount === 'annual' ? 'annualBalance' : 'solidaraBalance';
          console.log(`[ACTION INFO] Processing Deposit for target: ${targetBalanceField}`);
          t.update(userRef, { [targetBalanceField]: FieldValue.increment(amount) });
        
        } else if (txData.type === 'Withdrawal') {
          // On withdrawal approval, the requested amount is debited from the balance.
          // The 'amount' is stored as a positive number, so we must make it negative for the increment.
          console.log(`[ACTION INFO] Processing Withdrawal from solidara account.`);
          t.update(userRef, { solidaraBalance: FieldValue.increment(-amount) });
        }
      }
      // If newStatus is 'Failed', we do nothing to the balances, just update the status.
    });

    console.log('[ACTION SUCCESS] Firestore transaction completed successfully.');
    return { success: true };

  } catch (error: any) {
    console.error('[ACTION CRASH] Error in updateTransactionStatus server action:', error);
    return { success: false, error: error.message || 'An unknown error occurred on the server.' };
  }
}

