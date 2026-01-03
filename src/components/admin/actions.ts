
'use server';

import { doc, runTransaction, Firestore, collection, serverTimestamp, increment } from 'firebase/firestore';
import type { Transaction, TransactionStatus } from '@/lib/types';

export async function updateTransactionStatus(
  firestore: Firestore,
  transactionPath: string,
  newStatus: 'Completed' | 'Failed'
): Promise<{ success: boolean; error?: string }> {
  const transactionRef = doc(firestore, transactionPath);
  const pathParts = transactionPath.split('/');
  const userId = pathParts[pathParts.indexOf('users') + 1];
  const userRef = doc(firestore, 'users', userId);

  try {
    await runTransaction(firestore, async (transaction) => {
      const txDoc = await transaction.get(transactionRef);
      if (!txDoc.exists()) {
        throw new Error('Transaction not found.');
      }
      
      const txData = txDoc.data() as Transaction;
      if (txData.status !== 'Pending') {
        throw new Error('This transaction has already been processed.');
      }

      transaction.update(transactionRef, { status: newStatus });

      if (newStatus === 'Completed') {
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
