
'use server';

import { doc, runTransaction, Firestore, collection, serverTimestamp, increment } from 'firebase/firestore';
import type { Transaction, TransactionStatus } from '@/lib/types';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export async function updateTransactionStatus(
  firestore: Firestore,
  transactionPath: string,
  newStatus: 'Completed' | 'Failed'
): Promise<{ success: boolean; error?: string }> {
  const transactionRef = doc(firestore, transactionPath);
  const pathParts = transactionPath.split('/');
  const userId = pathParts[pathParts.indexOf('users') + 1];
  const userRef = doc(firestore, 'users', userId);

  try {
    await runTransaction(firestore, async (transaction) => {
      const txDoc = await transaction.get(transactionRef);
      if (!txDoc.exists()) {
        throw new Error('Transaction not found.');
      }
      
      const txData = txDoc.data() as Transaction;
      if (txData.status !== 'Pending') {
        throw new Error('This transaction has already been processed.');
      }

      // Update the transaction status
      transaction.update(transactionRef, { status: newStatus });

      // If approved, update the user's balance
      if (newStatus === 'Completed') {
        const amount = txData.amount; // Can be positive (deposit) or negative (withdrawal)
        const targetAccount = txData.targetAccount;

        if (targetAccount === 'solidara') {
          transaction.update(userRef, { solidaraBalance: increment(amount) });
        } else if (targetAccount === 'annual') {
          transaction.update(userRef, { annualBalance: increment(amount) });
        }
        // Note: 'group' transactions are handled by a separate flow and should not appear here.
      }
    });

    return { success: true };

  } catch (error: any) {
    console.error('Error updating transaction status:', error);
     if (error.code === 'permission-denied') {
        const permissionError = new FirestorePermissionError({
            path: transactionPath,
            operation: 'update',
        });
        errorEmitter.emit('permission-error', permissionError);
        return { success: false, error: "Permission denied. You might not have the required roles." };
     }
    return { success: false, error: error.message || 'An unknown error occurred.' };
  }
}
