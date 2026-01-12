
'use server';

import { FieldValue } from 'firebase-admin/firestore';
import { firestore as adminFirestore } from '@/firebase/server-init';
import type { Transaction, UserData } from '@/lib/types';

export async function updateTransactionStatus(
  transactionPath: string,
  newStatus: 'Completed' | 'Failed'
): Promise<{ success: boolean; error?: string }> {
  if (!adminFirestore) {
    return {
      success: false,
      error: 'Server is not configured for database access. Please contact support.',
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
      const userData = userDoc.data() as UserData;

      if (txData.status !== 'Pending') {
        throw new Error('This transaction has already been processed.');
      }

      // --- Update transaction status ---
      t.update(transactionRef, { status: newStatus });

      // --- Handle balance changes based on transaction type and new status ---
      if (newStatus === 'Completed') {
        if (txData.type === 'Deposit') {
          const amount = txData.amount;
          if (txData.targetAccount === 'solidara') {
            t.update(userRef, { solidaraBalance: FieldValue.increment(amount) });
          } else if (txData.targetAccount === 'annual') {
            t.update(userRef, { annualBalance: FieldValue.increment(amount) });
          }
        } else if (txData.type === 'Withdrawal') {
          const amountToDebit = txData.amount;
          // Ensure the user still has enough funds before debiting
          if (userData.solidaraBalance < amountToDebit) {
            throw new Error('User has insufficient funds for this withdrawal.');
          }
          t.update(userRef, { solidaraBalance: FieldValue.increment(-amountToDebit) });
        }
      }
      // Note: If a withdrawal is 'Failed', no balance change is needed as the
      // funds were never debited in the first place.
      // If a deposit is 'Failed', no balance change is needed.
    });

    return { success: true };

  } catch (error: any) {
    console.error('Error updating transaction status:', error);
    return { success: false, error: error.message || 'An unknown error occurred.' };
  }
}
