
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
  const txDoc = await getDoc(txRef);
  if (!txDoc.exists()) {
    return { success: false, error: 'Transaction not found.' };
  }
  const txData = txDoc.data() as Transaction;
  
  if (txData.status !== 'Pending') {
    return { success: false, error: `Transaction is already ${txData.status.toLowerCase()}.` };
  }
    
  // --- Logic for 'Failed' (Decline) status ---
  if (newStatus === 'Failed') {
      const batch = writeBatch(firestore);
      batch.delete(txRef);
      const notificationRef = doc(collection(firestore, `users/${userId}/notifications`));
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
  const userDoc = await getDoc(userRef);
  if (!userDoc.exists()) {
      return { success: false, error: "User data not found. Cannot update balance." };
  }

  const batch = writeBatch(firestore);
  batch.update(txRef, { status: newStatus });

  const amount = Number(txData.amount);
  if (isNaN(amount)) {
      return { success: false, error: "Invalid transaction amount." };
  }

  if (txData.type === 'Deposit' || txData.type === 'Withdrawal') {
      const targetAccount = txData.targetAccount || 'solidara';

      if (targetAccount !== 'solidara' && targetAccount !== 'annual') {
         return { success: false, error: 'Invalid target account on the transaction.' };
      }
      
      const balanceFieldToUpdate = `${targetAccount}Balance` as keyof UserData;
      
      const balanceUpdate = { [balanceFieldToUpdate]: increment(amount) };
      batch.update(userRef, balanceUpdate);
  }
  
  const notificationRef = doc(collection(firestore, `users/${userId}/notifications`));
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
        const permissionError = new FirestorePermissionError({
            path: userRef.path, // The user path is more likely to fail on balance updates
            operation: 'update',
            requestResourceData: { balanceUpdate: { amount: amount, account: txData.targetAccount } }
        });
        errorEmitter.emit('permission-error', permissionError);
    });

  return { success: true };
}
