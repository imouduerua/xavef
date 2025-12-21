
'use client';

import { doc, getDoc, updateDoc, writeBatch, Firestore, increment } from 'firebase/firestore';
import type { Transaction, UserData } from '@/lib/types';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';

/**
 * Updates the status of a transaction and, if approved, the user's balance.
 * This is a client-side action that relies on Firestore security rules
 * to ensure only admins can perform it.
 */
export async function updateTransactionStatus(
  firestore: Firestore,
  userId: string,
  transactionId: string,
  newStatus: 'Completed' | 'Failed'
): Promise<{ success: boolean; error?: string }> {
  
  const txRef = doc(firestore, `users/${userId}/transactions`, transactionId);
  const userRef = doc(firestore, 'users', userId);

  try {
    const txDoc = await getDoc(txRef);
    if (!txDoc.exists()) {
      throw new Error('Transaction not found.');
    }

    const txData = txDoc.data() as Transaction;
    if (txData.status !== 'Pending') {
      throw new Error(`Transaction is already ${txData.status.toLowerCase()}.`);
    }

    const batch = writeBatch(firestore);

    // Update the transaction status
    batch.update(txRef, { status: newStatus });

    // If approving a transaction, update the user's balance
    if (newStatus === 'Completed') {
       const amount = Number(txData.amount);
       if (isNaN(amount)) {
         throw new Error("Invalid transaction amount.")
       }

       // For deposits, amount is positive. For withdrawals, it's negative.
       // The `increment` function handles both addition and subtraction.
       if (txData.type === 'Deposit' || txData.type === 'Withdrawal') {
         const targetAccount = txData.targetAccount || 'solidara';

         if (targetAccount !== 'solidara' && targetAccount !== 'annual') {
           throw new Error('Invalid target account on the transaction.');
         }
         
         const balanceFieldToUpdate = `${targetAccount}Balance` as keyof UserData;
         
         const balanceUpdate = { [balanceFieldToUpdate]: increment(amount) };
         batch.update(userRef, balanceUpdate);
       }
    }

    await batch.commit().catch(async (serverError) => {
        // This is the new, critical error handling part.
        const txUpdateError = new FirestorePermissionError({
            path: txRef.path,
            operation: 'update',
            requestResourceData: { status: newStatus },
        });
        errorEmitter.emit('permission-error', txUpdateError);
        
        // We assume if the batch fails, it's the user doc update that's the issue.
        if (newStatus === 'Completed') {
            const userUpdateError = new FirestorePermissionError({
                path: userRef.path,
                operation: 'update',
                requestResourceData: { balance: 'increment' }
            });
             errorEmitter.emit('permission-error', userUpdateError);
        }

        // We re-throw the original error to be caught by the outer block
        // so the UI can still show a generic failure message.
        throw serverError;
    });

    return { success: true };
  } catch (error: any) {
    console.error('[updateTransactionStatus] Error:', error);
    // Don't emit another error here, let the catch block in `commit` handle it.
    if (!(error instanceof FirestorePermissionError)) {
        return { success: false, error: error.message || 'An unknown error occurred.' };
    }
    // Error was already emitted, so we just return the failure state.
    return { success: false, error: error.message };
  }
}
