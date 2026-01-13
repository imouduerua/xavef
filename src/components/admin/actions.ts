
'use server';

import { FieldValue } from 'firebase-admin/firestore';
import { firestore as adminFirestore } from '@/firebase/server-init';
import type { Transaction } from '@/lib/types';

export async function updateTransactionStatus(
  transactionPath: string,
  newStatus: 'Completed' | 'Failed'
): Promise<{ success: boolean; error?: string }> {
  console.log(`[ACTION START] updateTransactionStatus: path=${transactionPath}, newStatus=${newStatus}`);

  if (!adminFirestore) {
    console.error('[ACTION ERROR] adminFirestore is not initialized.');
    return {
      success: false,
      error: 'Server is not configured for database access.',
    };
  }

  const transactionRef = adminFirestore.doc(transactionPath);
  const pathParts = transactionPath.split('/');
  const userId = pathParts[pathParts.indexOf('users') + 1];
  const userRef = adminFirestore.doc(`users/${userId}`);

  console.log(`[ACTION INFO] Parsed userId: ${userId}`);

  try {
    await adminFirestore.runTransaction(async (t) => {
      console.log('[ACTION INFO] Starting Firestore transaction.');
      const txDoc = await t.get(transactionRef);
      const userDoc = await t.get(userRef);

      if (!txDoc.exists) {
        throw new Error('Transaction document not found.');
      }
      if (!userDoc.exists) {
        throw new Error(`User document not found for userId: ${userId}`);
      }
      
      const txData = txDoc.data() as Transaction;
      console.log('[ACTION INFO] Fetched transaction data:', txData);

      if (txData.status !== 'Pending') {
        throw new Error('This transaction has already been processed.');
      }

      // 1. Update the transaction status
      console.log(`[ACTION INFO] Updating transaction status to ${newStatus}.`);
      t.update(transactionRef, { status: newStatus });

      // 2. If it failed, do nothing to balances.
      if (newStatus === 'Failed') {
        console.log('[ACTION INFO] Status is "Failed". No balance changes needed.');
        return;
      }
      
      // 3. If it completed, update user balance.
      if (newStatus === 'Completed') {
        const amount = txData.amount;
        console.log(`[ACTION INFO] Status is "Completed". Amount: ${amount}`);
        
        if (txData.type === 'Deposit') {
          console.log(`[ACTION INFO] Processing Deposit for target: ${txData.targetAccount}`);
          if (txData.targetAccount === 'solidara') {
            t.update(userRef, { solidaraBalance: FieldValue.increment(amount) });
            console.log(`[ACTION INFO] Incremented solidaraBalance by ${amount}.`);
          } else if (txData.targetAccount === 'annual') {
            t.update(userRef, { annualBalance: FieldValue.increment(amount) });
            console.log(`[ACTION INFO] Incremented annualBalance by ${amount}.`);
          }
        } else if (txData.type === 'Withdrawal') {
          // On withdrawal approval, the requested amount is debited from the balance.
          // The amount is stored as a positive number, so we must make it negative here.
          console.log(`[ACTION INFO] Processing Withdrawal.`);
          t.update(userRef, { solidaraBalance: FieldValue.increment(-amount) });
          console.log(`[ACTION INFO] Decremented solidaraBalance by ${amount}.`);
        }
      }
    });

    console.log('[ACTION SUCCESS] Firestore transaction completed successfully.');
    return { success: true };

  } catch (error: any) {
    console.error('[ACTION CRASH] Error in updateTransactionStatus server action:', error);
    return { success: false, error: error.message || 'An unknown error occurred on the server.' };
  }
}
