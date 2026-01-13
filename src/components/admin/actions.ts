
'use server';

import { FieldValue } from 'firebase-admin/firestore';
import { firestore as adminFirestore } from '@/firebase/server-init';
import type { Transaction, UserData } from '@/lib/types';

export async function updateTransactionStatus(
  transactionPath: string,
  newStatus: 'Completed' | 'Failed'
): Promise<{ success: boolean; error?: string }> {
  console.log(`[ACTION START] updateTransactionStatus: path=${transactionPath}, newStatus=${newStatus}`);

  if (!adminFirestore) {
    const errorMsg = 'Server is not configured for database access.';
    console.error(`[ACTION CRASH] ${errorMsg}`);
    return { success: false, error: errorMsg };
  }

  const transactionRef = adminFirestore.doc(transactionPath);
  
  // A more robust way to get the parent user reference, instead of splitting the path string.
  // The path is users/{userId}/transactions/{transactionId}, so the user doc is two levels up.
  const userRef = transactionRef.parent.parent;

  if (!userRef) {
      const errorMsg = 'Could not determine the user document from the transaction path.';
      console.error(`[ACTION CRASH] ${errorMsg}`);
      return { success: false, error: errorMsg };
  }
  
  console.log(`[ACTION INFO] User Ref Path: ${userRef.path}`);

  try {
    await adminFirestore.runTransaction(async (t) => {
      console.log('[ACTION INFO] Starting Firestore transaction.');
      const txDoc = await t.get(transactionRef);
      const userDoc = await t.get(userRef);

      if (!txDoc.exists) {
        throw new Error(`Transaction document not found at path: ${transactionPath}`);
      }
      if (!userDoc.exists) {
        throw new Error(`User document not found at path: ${userRef.path}`);
      }
      
      const txData = txDoc.data() as Transaction;
      console.log('[ACTION INFO] Fetched transaction data:', txData);

      if (txData.status !== 'Pending') {
        console.warn(`[ACTION WARN] Transaction ${txDoc.id} is already processed with status: ${txData.status}.`);
        throw new Error('This transaction has already been processed.');
      }

      // 1. Update the transaction status
      console.log(`[ACTION INFO] Updating transaction ${txDoc.id} status to ${newStatus}.`);
      t.update(transactionRef, { status: newStatus });

      // 2. If it failed, do nothing to balances.
      if (newStatus === 'Failed') {
        console.log('[ACTION INFO] Status is "Failed". No balance changes needed.');
        return; // End of transaction logic
      }
      
      // 3. If it completed, update user balance.
      if (newStatus === 'Completed') {
        const amount = txData.amount; // For both deposits and withdrawals, amount is positive
        console.log(`[ACTION INFO] Status is "Completed". Amount: ${amount}`);
        
        if (txData.type === 'Deposit') {
          console.log(`[ACTION INFO] Processing Deposit for target: ${txData.targetAccount}`);
          if (txData.targetAccount === 'solidara') {
            t.update(userRef, { solidaraBalance: FieldValue.increment(amount) });
            console.log(`[ACTION INFO] Incremented solidaraBalance by ${amount}.`);
          } else if (txData.targetAccount === 'annual') {
            t.update(userRef, { annualBalance: FieldValue.increment(amount) });
            console.log(`[ACTION INFO] Incremented annualBalance by ${amount}.`);
          } else {
             console.warn(`[ACTION WARN] Unknown target account for deposit: ${txData.targetAccount}`);
          }
        } else if (txData.type === 'Withdrawal') {
          // On withdrawal approval, the requested amount is debited from the balance.
          // The amount is stored as a positive number, so we must make it negative here.
          console.log(`[ACTION INFO] Processing Withdrawal from solidara account.`);
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
