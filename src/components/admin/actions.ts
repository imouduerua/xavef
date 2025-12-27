
'use client';

import { doc, getDoc, updateDoc, writeBatch, Firestore, increment, collection, query, where, getDocs, limit, deleteDoc, serverTimestamp, addDoc, runTransaction } from 'firebase/firestore';
import type { Transaction, UserData } from '@/lib/types';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

/**
 * Updates the status of a transaction and, if approved, the user's balance.
 * If declined ('Failed'), the transaction document is deleted.
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

  // --- Logic for 'Failed' (Decline) status ---
  if (newStatus === 'Failed') {
      const batch = writeBatch(firestore);
      const notificationRef = doc(collection(firestore, `users/${userId}/notifications`));
      
      let txData;
      try {
        const txSnap = await getDoc(txRef);
        if (!txSnap.exists()) return { success: false, error: 'Transaction not found.' };
        txData = txSnap.data();
      } catch (e: any) {
        // This is likely a permission error on the get() call
        const permissionError = new FirestorePermissionError({ path: txRef.path, operation: 'get' });
        errorEmitter.emit('permission-error', permissionError);
        return { success: false, error: 'Failed to fetch transaction details.'};
      }

      batch.delete(txRef);
      batch.set(notificationRef, {
          userId: userId,
          title: 'Transaction Declined',
          description: `Your ${txData.type.toLowerCase()} of ₦${Math.abs(txData.amount)} was declined.`,
          createdAt: serverTimestamp(),
          read: false,
      });

      batch.commit()
        .catch(serverError => {
            const permissionError = new FirestorePermissionError({ path: txRef.path, operation: 'delete' });
            errorEmitter.emit('permission-error', permissionError);
        });
        
      return { success: true };
  }

  // --- Logic for 'Completed' (Approve) status ---
  try {
    await runTransaction(firestore, async (transaction) => {
        const txDoc = await transaction.get(txRef);
        if (!txDoc.exists() || txDoc.data().status !== 'Pending') {
            throw new Error('Transaction not found or is not in a pending state.');
        }

        const txData = txDoc.data() as Transaction;
        const amount = Number(txData.amount);
        const targetAccount = txData.targetAccount || 'solidara';

        if (targetAccount !== 'solidara' && targetAccount !== 'annual') {
            throw new Error('Invalid target account on the transaction.');
        }

        // 1. Update the user's balance
        const balanceFieldToUpdate = targetAccount === 'solidara' ? 'solidaraBalance' : 'annualBalance';
        transaction.update(userRef, { [balanceFieldToUpdate]: increment(amount) });
        
        // 2. Update the transaction status
        transaction.update(txRef, { status: 'Completed' });

        // 3. Create a notification for the user
        const notificationRef = doc(collection(firestore, `users/${userId}/notifications`));
        transaction.set(notificationRef, {
            userId: userId,
            title: 'Transaction Completed',
            description: `Your ${txData.type.toLowerCase()} of ₦${Math.abs(txData.amount)} has been completed.`,
            createdAt: serverTimestamp(),
            read: false,
            actionUrl: '/transactions'
        });
    });

    return { success: true };

  } catch (error: any) {
    // If the transaction fails, it's highly likely a permissions issue on one of the operations.
    // We emit a generic error for the batch, as it's hard to know which operation failed.
    // The console error overlay from the listener will provide more specific details.
    const permissionError = new FirestorePermissionError({
        path: userRef.path, // The user path is a likely culprit
        operation: 'update',
        requestResourceData: { note: 'This was part of a batch write for transaction approval.' }
    });
    errorEmitter.emit('permission-error', permissionError);

    console.error("Transaction update failed:", error);
    return { success: false, error: error.message || 'An unexpected error occurred during transaction approval.' };
  }
}

