
'use client';

import { doc, getDoc, updateDoc, writeBatch, Firestore, increment, collection, query, where, getDocs, limit } from 'firebase/firestore';
import type { Transaction, UserData } from '@/lib/types';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

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
    
    const userDoc = await getDoc(userRef);
    if (!userDoc.exists()) {
        throw new Error("User data not found. Cannot update balance.");
    }

    const batch = writeBatch(firestore);

    // Update the original transaction status
    batch.update(txRef, { status: newStatus });

    // If approving a transaction, update the relevant user's balance(s)
    if (newStatus === 'Completed') {
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
       } else if (txData.type === 'User Transfer') {
         
         if (!txData.recipientXavefId) {
            throw new Error("Recipient information is missing from the transfer.");
         }
         // 1. Debit the sender (amount is already negative)
         batch.update(userRef, { solidaraBalance: increment(amount) });
         
         // 2. Find and credit the recipient
         const recipientQuery = query(collection(firestore, 'users'), where('xavefId', '==', txData.recipientXavefId), limit(1));
         const recipientSnapshot = await getDocs(recipientQuery);
         
         if (recipientSnapshot.empty) {
            throw new Error(`Recipient with Xavef ID ${txData.recipientXavefId} not found.`);
         }
         
         const recipientDoc = recipientSnapshot.docs[0];
         const recipientRef = recipientDoc.ref;
         const recipientData = recipientDoc.data() as UserData;
         
         // 3. Credit the recipient's balance
         batch.update(recipientRef, { solidaraBalance: increment(Math.abs(amount)) });
         
         // 4. Create a transaction record for the recipient
         const recipientTxCollection = collection(firestore, `users/${recipientRef.id}/transactions`);
         batch.set(doc(recipientTxCollection), {
            date: txData.date,
            amount: Math.abs(amount),
            description: `Transfer from ${userDoc.data()?.displayName || 'a user'}`,
            type: 'User Transfer',
            status: 'Completed',
            targetAccount: 'solidara'
         });
       }
    }

    await batch.commit();

    return { success: true };
  } catch (error: any) {
    console.error('[updateTransactionStatus] Error:', error);
    
    const permissionError = new FirestorePermissionError({
        path: userRef.path,
        operation: 'update',
        requestResourceData: { balance: 'increment' }
    });
    errorEmitter.emit('permission-error', permissionError);

    return { success: false, error: error.message || 'An unknown error occurred.' };
  }
}
