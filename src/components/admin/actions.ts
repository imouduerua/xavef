
'use client';

import { doc, runTransaction, Firestore, collection, serverTimestamp, getDoc, updateDoc } from 'firebase/firestore';
import type { Transaction } from '@/lib/types';


/**
 * Updates the status of a transaction and, if approved, the user's balance.
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
        
        const notificationRef = doc(collection(firestore, `users/${userId}/notifications`));

        if (newStatus === 'Failed') {
            transaction.update(txRef, { status: 'Failed' });
            transaction.set(notificationRef, {
                userId: userId,
                title: 'Transaction Declined',
                description: `Your ${txData.type.toLowerCase()} of ₦${Math.abs(txData.amount)} was declined. Please contact support for details.`,
                createdAt: serverTimestamp(),
                read: false,
            });
        } else { // Completed
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
            
            transaction.update(userRef, { [balanceFieldToUpdate]: userSnap.data()[balanceFieldToUpdate] + amount });
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
    console.error('Error during transaction status update:', error);
    return { success: false, error: error.message || 'An unexpected error occurred.' };
  }
}
