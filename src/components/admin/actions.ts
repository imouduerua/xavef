
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
      try {
        await runTransaction(firestore, async (transaction) => {
            const txSnap = await transaction.get(txRef);
            if (!txSnap.exists()) {
                throw new Error('Transaction not found.');
            }
            const txData = txSnap.data() as Transaction;
            const notificationRef = doc(collection(firestore, `users/${userId}/notifications`));

            transaction.delete(txRef);
            transaction.set(notificationRef, {
                userId: userId,
                title: 'Transaction Declined',
                description: `Your ${txData.type.toLowerCase()} of ₦${Math.abs(txData.amount)} was declined. Please contact support for details.`,
                createdAt: serverTimestamp(),
                read: false,
            });
        });

        return { success: true };

      } catch (error: any) {
        const permissionError = new FirestorePermissionError({
            path: txRef.path,
            operation: 'delete',
            requestResourceData: { note: "This was part of a decline transaction batch."}
        });
        errorEmitter.emit('permission-error', permissionError);
        
        console.error("Decline transaction failed:", error);
        return { success: false, error: error.message || 'Could not decline transaction.' };
      }
  }

  // --- Logic for 'Completed' (Approve) status ---
  try {
    await runTransaction(firestore, async (transaction) => {
        const txDoc = await transaction.get(txRef);
        if (!txDoc.exists() || txDoc.data().status !== 'Pending') {
            throw new Error('Transaction not found or is not in a pending state.');
        }

        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists()) {
          throw new Error("User associated with this transaction could not be found.");
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
    const permissionError = new FirestorePermissionError({
        path: userRef.path, 
        operation: 'update',
        requestResourceData: { note: 'This was part of a batch write for transaction approval.' }
    });
    errorEmitter.emit('permission-error', permissionError);

    console.error("Transaction approval failed:", error);
    return { success: false, error: error.message || 'An unexpected error occurred during transaction approval.' };
  }
}
