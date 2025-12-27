
'use client';

import { doc, getDoc, updateDoc, writeBatch, Firestore, increment, collection, query, where, getDocs, limit, deleteDoc, serverTimestamp, addDoc } from 'firebase/firestore';
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
  
  let txData: Transaction;
  try {
      const txDoc = await getDoc(txRef);
      if (!txDoc.exists()) {
        return { success: false, error: 'Transaction not found.' };
      }
      txData = txDoc.data() as Transaction;
  } catch (e: any) {
    return { success: false, error: `Failed to fetch transaction: ${e.message}`};
  }

  
  if (txData.status !== 'Pending') {
    return { success: false, error: `Transaction is already ${txData.status.toLowerCase()}.` };
  }
    
  const batch = writeBatch(firestore);
  const notificationRef = doc(collection(firestore, `users/${userId}/notifications`));

  // --- Logic for 'Failed' (Decline) status ---
  if (newStatus === 'Failed') {
      batch.delete(txRef);
      batch.set(notificationRef, {
          userId: userId,
          title: 'Transaction Declined',
          description: `Your ${txData.type.toLowerCase()} of ₦${Math.abs(txData.amount)} was declined.`,
          createdAt: serverTimestamp(),
          read: false,
      });

      // NO AWAIT HERE, CHAIN .catch()
      batch.commit()
        .catch(serverError => {
            const permissionError = new FirestorePermissionError({
                path: txRef.path,
                operation: 'delete',
            });
            errorEmitter.emit('permission-error', permissionError);
        });
        
      return { success: true };
  }

  // --- Logic for 'Completed' (Approve) status ---
  const userRef = doc(firestore, 'users', userId);

  batch.update(txRef, { status: newStatus });

  const amount = Number(txData.amount);
  if (isNaN(amount)) {
      return { success: false, error: "Invalid transaction amount." };
  }
  
  let balanceUpdate: { solidaraBalance?: any, annualBalance?: any } = {};

  if (txData.type === 'Deposit' || txData.type === 'Withdrawal') {
      const targetAccount = txData.targetAccount || 'solidara';

      if (targetAccount !== 'solidara' && targetAccount !== 'annual') {
         return { success: false, error: 'Invalid target account on the transaction.' };
      }
      
      const balanceFieldToUpdate = targetAccount === 'solidara' ? 'solidaraBalance' : 'annualBalance';
      balanceUpdate = { [balanceFieldToUpdate]: increment(amount) };
      batch.update(userRef, balanceUpdate);
  }
  
  batch.set(notificationRef, {
      userId: userId,
      title: 'Transaction Completed',
      description: `Your ${txData.type.toLowerCase()} of ₦${Math.abs(txData.amount)} has been completed.`,
      createdAt: serverTimestamp(),
      read: false,
      actionUrl: '/transactions'
  });

  // NO AWAIT HERE, CHAIN .catch()
  batch.commit()
    .catch(serverError => {
        // The most likely permission error here is on the user balance update.
        const permissionError = new FirestorePermissionError({
            path: userRef.path,
            operation: 'update',
            requestResourceData: balanceUpdate
        });
        errorEmitter.emit('permission-error', permissionError);
    });

  return { success: true };
}
