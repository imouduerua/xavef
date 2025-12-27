
'use client';

import { doc, runTransaction, Firestore, collection, serverTimestamp, getDoc } from 'firebase/firestore';
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
        const txSnap = await transaction.get(txRef);
        if (!txSnap.exists()) {
            throw new Error('Transaction not found or has already been processed.');
        }
        const txData = txSnap.data() as Transaction;
        
        if (txData.status !== 'Pending') {
            throw new Error(`This transaction is already marked as ${txData.status}.`);
        }

        if (newStatus === 'Failed') {
            transaction.delete(txRef);
            transaction.set(notificationRef, {
                userId: userId,
                title: 'Transaction Declined',
                description: `Your ${txData.type.toLowerCase()} of ₦${Math.abs(txData.amount)} was declined. Please contact support for details.`,
                createdAt: serverTimestamp(),
                read: false,
            });
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

            transaction.update(userRef, { [balanceFieldToUpdate]: newBalance });
            transaction.update(txRef, { status: 'Completed' });

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
