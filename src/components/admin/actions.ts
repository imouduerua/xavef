
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
      error: 'Server is not configured for database access. Please contact support.',
    };
  }

  const transactionRef = adminFirestore.doc(transactionPath);
  const pathParts = transactionPath.split('/');
  const userId = pathParts[pathParts.indexOf('users') + 1];
  const userRef = adminFirestore.doc(`users/${userId}`);

  try {
    await adminFirestore.runTransaction(async (transaction) => {
      const txDoc = await transaction.get(transactionRef);
      if (!txDoc.exists) {
        throw new Error('Transaction not found.');
      }
      
      const txData = txDoc.data() as Transaction;
      if (txData.status !== 'Pending') {
        throw new Error('This transaction has already been processed.');
      }

      transaction.update(transactionRef, { status: newStatus });

      // If a DEPOSIT is COMPLETED, credit the user's target account.
      if (newStatus === 'Completed' && txData.type === 'Deposit') {
        const amount = txData.amount; 
        const targetAccount = txData.targetAccount;

        if (targetAccount === 'solidara') {
          transaction.update(userRef, { solidaraBalance: FieldValue.increment(amount) });
        } else if (targetAccount === 'annual') {
          transaction.update(userRef, { annualBalance: FieldValue.increment(amount) });
        }
      }

      // If a WITHDRAWAL FAILS, refund the amount to the user's solidara balance.
      // The amount was debited from the user's account when the request was made.
      if (newStatus === 'Failed' && txData.type === 'Withdrawal') {
        const amountToRefund = Math.abs(txData.amount); // amount is negative for withdrawals
        transaction.update(userRef, { solidaraBalance: FieldValue.increment(amountToRefund) });
      }
    });

    return { success: true };

  } catch (error: any) {
    console.error('Error updating transaction status:', error);
    return { success: false, error: error.message || 'An unknown error occurred.' };
  }
}
