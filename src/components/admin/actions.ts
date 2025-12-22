
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
         
         // For deposits, amount is positive. For withdrawals, it's negative.
         // The `increment` function handles both addition and subtraction.
         const balanceUpdate = { [balanceFieldToUpdate]: increment(amount) };
         batch.update(userRef, balanceUpdate);
       }
       
       if (txData.type === 'User Transfer') {
         // This is a transfer FROM the current `userId` TO a recipient.
         // The amount on the sender's transaction is already negative.
         const senderRef = userRef;
         
         // 1. Debit the sender (the user associated with this transaction)
         batch.update(senderRef, { solidaraBalance: increment(amount) });
         
         // 2. Find and credit the recipient
         const recipientXavefId = txData.description.match(/\(([^)]+)\)/)?.[1];
         if (!recipientXavefId) throw new Error("Could not find recipient Xavef ID in description.");

         const usersRef = collection(firestore, 'users');
         const q = query(usersRef, where("xavefId", "==", recipientXavefId), limit(1));
         const recipientSnapshot = await getDocs(q);

         if (recipientSnapshot.empty) {
            throw new Error(`Recipient with Xavef ID ${recipientXavefId} not found.`);
         }

         const recipientDoc = recipientSnapshot.docs[0];
         const recipientRef = recipientDoc.ref;
         const recipientData = recipientDoc.data() as UserData;
         const senderData = userDoc.data() as UserData;
         
         // Credit the recipient with the positive amount
         batch.update(recipientRef, { solidaraBalance: increment(Math.abs(amount)) });
         
         // 3. Create the corresponding "credit" transaction for the recipient
         const recipientTxCollectionRef = collection(firestore, `users/${recipientRef.id}/transactions`);
         batch.set(doc(recipientTxCollectionRef), {
           amount: Math.abs(amount),
           date: txData.date, // use same timestamp
           description: `Transfer from ${senderData.displayName || senderData.email}`,
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
