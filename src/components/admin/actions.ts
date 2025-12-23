
'use client';

import { doc, getDoc, updateDoc, writeBatch, Firestore, increment, collection, query, where, getDocs, limit, deleteDoc } from 'firebase/firestore';
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

  try {
    const txDoc = await getDoc(txRef);
    if (!txDoc.exists()) {
      throw new Error('Transaction not found.');
    }

    const txData = txDoc.data() as Transaction;
    if (txData.status !== 'Pending') {
      throw new Error(`Transaction is already ${txData.status.toLowerCase()}.`);
    }
    
    // If declining, simply delete the transaction document.
    if (newStatus === 'Failed') {
        await deleteDoc(txRef);
        return { success: true };
    }

    // --- Logic for 'Completed' status ---
    const userDoc = await getDoc(userRef);
    if (!userDoc.exists()) {
        throw new Error("User data not found. Cannot update balance.");
    }

    const batch = writeBatch(firestore);

    // Update the original transaction status
    batch.update(txRef, { status: newStatus });

    // If approving a transaction, update the relevant user's balance(s)
    const amount = Number(txData.amount);
    if (isNaN(amount)) {
        throw new Error("Invalid transaction amount.")
    }

    if (txData.type === 'Deposit' || txData.type === 'Withdrawal') {
        const targetAccount = txData.targetAccount || 'solidara';

        if (targetAccount !== 'solidara' && targetAccount !== 'annual') {
        throw new Error('Invalid target account on the transaction.');
        }
        
        const balanceFieldToUpdate = `${targetAccount}Balance` as keyof UserData;
        
        const balanceUpdate = { [balanceFieldToUpdate]: increment(amount) };
        batch.update(userRef, balanceUpdate);
    }

    await batch.commit();

    return { success: true };
  } catch (error: any) {
    console.error('[updateTransactionStatus] Error:', error);
    
    // Emit a more specific error for debugging permission issues.
    if (error.code === 'permission-denied') {
        const permissionError = new FirestorePermissionError({
            path: newStatus === 'Failed' ? txRef.path : userRef.path,
            operation: newStatus === 'Failed' ? 'delete' : 'update',
        });
        errorEmitter.emit('permission-error', permissionError);
    }

    return { success: false, error: error.message || 'An unknown error occurred.' };
  }
}
