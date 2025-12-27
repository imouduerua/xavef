
'use client';

import { doc, runTransaction, Firestore, collection, serverTimestamp } from 'firebase/firestore';
import type { Transaction } from '@/lib/types';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

/**
 * Updates the status of a transaction and, if approved, the user's balance.
 * If declined ('Failed'), the transaction document is deleted and a notification is created.
 * All operations are performed within a single atomic Firestore transaction.
 */
export async function updateTransactionStatus(
  firestore: Firestore,
  userId: string,
  transactionId: string,
  newStatus: 'Completed' | 'Failed'
): Promise<{ success: boolean; error?: string }> {
  
  const txRef = doc(firestore, `users/${userId}/transactions`, transactionId);
  const userRef = doc(firestore, 'users', userId);
  const notificationRef = doc(collection(firestore, `users/${userId}/notifications`));

  try {
    await runTransaction(firestore, async (transaction) => {
        // First, read the transaction document within the atomic transaction.
        const txSnap = await transaction.get(txRef);
        if (!txSnap.exists()) {
            throw new Error('Transaction not found or has already been processed.');
        }
        const txData = txSnap.data() as Transaction;
        
        // Ensure we are not re-processing a completed/failed transaction.
        if (txData.status !== 'Pending') {
            throw new Error(`This transaction is already marked as ${txData.status}.`);
        }

        // --- Logic for 'Failed' (Decline) status ---
        if (newStatus === 'Failed') {
            // Delete the original transaction document.
            transaction.delete(txRef);
            // Create a notification for the user about the decline.
            transaction.set(notificationRef, {
                userId: userId,
                title: 'Transaction Declined',
                description: `Your ${txData.type.toLowerCase()} of ₦${Math.abs(txData.amount)} was declined. Please contact support for details.`,
                createdAt: serverTimestamp(),
                read: false,
            });

        // --- Logic for 'Completed' (Approve) status ---
        } else {
            const userSnap = await transaction.get(userRef);
            if (!userSnap.exists()) {
                throw new Error("User data not found for this transaction.");
            }

            const amount = Number(txData.amount);
            const targetAccount = txData.targetAccount || 'solidara';

            if (targetAccount !== 'solidara' && targetAccount !== 'annual') {
                throw new Error('Invalid target account specified on the transaction.');
            }
            
            const balanceFieldToUpdate = targetAccount === 'solidara' ? 'solidaraBalance' : 'annualBalance';
            const currentBalance = userSnap.data()[balanceFieldToUpdate] || 0;
            const newBalance = currentBalance + amount;

            // Update the user's balance.
            transaction.update(userRef, { [balanceFieldToUpdate]: newBalance });
            
            // Update the transaction status to 'Completed'.
            transaction.update(txRef, { status: 'Completed' });

            // Create a notification for the user about the approval.
            transaction.set(notificationRef, {
                userId: userId,
                title: 'Transaction Completed',
                description: `Your ${txData.type.toLowerCase()} of ₦${Math.abs(txData.amount)} has been completed.`,
                createdAt: serverTimestamp(),
                read: false,
                actionUrl: '/transactions'
            });
        }
    });

    return { success: true };

  } catch (error: any) {
    // This will catch errors from within the transaction, like "document not found",
    // or if the transaction itself fails due to permissions.
    console.error("Error updating transaction status:", error);

    // If the error is a Firestore permission error, emit it for debugging.
    if (error.code === 'permission-denied') {
        const permissionError = new FirestorePermissionError({
            path: txRef.path, 
            operation: 'update',
            requestResourceData: { note: 'This was part of a batch write for transaction approval/decline.' }
        });
        errorEmitter.emit('permission-error', permissionError);
    }
    
    return { success: false, error: error.message || 'An unexpected error occurred.' };
  }
}
