
'use server';

import { doc, runTransaction, Firestore, collection, serverTimestamp, increment } from 'firebase/firestore';
import type { Transaction, TransactionStatus } from '@/lib/types';
import { firestore as adminFirestore } from '@/firebase/server-init';

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

  const transactionRef = doc(adminFirestore, transactionPath);
  const pathParts = transactionPath.split('/');
  const userId = pathParts[pathParts.indexOf('users') + 1];
  const userRef = doc(adminFirestore, 'users', userId);

  try {
    await runTransaction(adminFirestore, async (transaction) => {
      const txDoc = await transaction.get(transactionRef);
      if (!txDoc.exists()) {
        throw new Error('Transaction not found.');
      }
      
      const txData = txDoc.data() as Transaction;
      if (txData.status !== 'Pending') {
        throw new Error('This transaction has already been processed.');
      }

      transaction.update(transactionRef, { status: newStatus });

      // If it's a deposit that's completed, credit the user's account.
      // Withdrawals are debited at the time of request, so we only handle deposit logic here.
      if (newStatus === 'Completed' && txData.type === 'Deposit') {
        const amount = txData.amount; 
        const targetAccount = txData.targetAccount;

        if (targetAccount === 'solidara') {
          transaction.update(userRef, { solidaraBalance: increment(amount) });
        } else if (targetAccount === 'annual') {
          transaction.update(userRef, { annualBalance: increment(amount) });
        }
      }
    });

    return { success: true };

  } catch (error: any) {
    console.error('Error updating transaction status:', error);
    return { success: false, error: error.message || 'An unknown error occurred.' };
  }
}
