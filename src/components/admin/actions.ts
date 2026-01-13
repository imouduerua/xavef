
'use server';

import { FieldValue } from 'firebase-admin/firestore';
import { firestore as adminFirestore } from '@/firebase/server-init';
import type { Transaction } from '@/lib/types';

export async function updateTransactionStatus(
  transactionPath: string,
  newStatus: 'Completed' | 'Failed'
): Promise<{ success: boolean; error?: string }> {
  if (!adminFirestore) {
    return {
      success: false,
      error: 'Server is not configured for database access.',
    };
  }

  const transactionRef = adminFirestore.doc(transactionPath);
  const pathParts = transactionPath.split('/');
  const userId = pathParts[pathParts.indexOf('users') + 1];
  const userRef = adminFirestore.doc(`users/${userId}`);

  try {
    await adminFirestore.runTransaction(async (t) => {
      const txDoc = await t.get(transactionRef);
      const userDoc = await t.get(userRef);

      if (!txDoc.exists) {
        throw new Error('Transaction not found.');
      }
      if (!userDoc.exists) {
        throw new Error('User not found.');
      }
      
      const txData = txDoc.data() as Transaction;

      if (txData.status !== 'Pending') {
        throw new Error('This transaction has already been processed.');
      }

      // 1. Update the transaction status
      t.update(transactionRef, { status: newStatus });

      // 2. If the transaction is completed, update user balance.
      // If it failed, no balance change is needed as it was never debited.
      if (newStatus === 'Completed') {
        const amount = txData.amount;
        
        if (txData.type === 'Deposit') {
          if (txData.targetAccount === 'solidara') {
            t.update(userRef, { solidaraBalance: FieldValue.increment(amount) });
          } else if (txData.targetAccount === 'annual') {
            t.update(userRef, { annualBalance: FieldValue.increment(amount) });
          }
        } else if (txData.type === 'Withdrawal') {
          // On withdrawal approval, the requested amount is debited from the balance.
          // The amount is stored as a positive number, so we must make it negative here.
          t.update(userRef, { solidaraBalance: FieldValue.increment(-amount) });
        }
      }
    });

    return { success: true };

  } catch (error: any) {
    console.error('Error in updateTransactionStatus server action:', error);
    return { success: false, error: error.message || 'An unknown error occurred on the server.' };
  }
}
