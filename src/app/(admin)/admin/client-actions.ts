'use client';

import { doc, runTransaction, increment, type Firestore } from 'firebase/firestore';
import type { Transaction } from '@/lib/types';

export async function updateTransactionStatusClient(
  firestore: Firestore,
  userId: string,
  transactionId: string,
  decision: 'approved' | 'declined'
): Promise<{ success: boolean; error?: string }> {

  const transactionRef = doc(firestore, 'users', userId, 'transactions', transactionId);
  const userRef = doc(firestore, 'users', userId);

  try {
    await runTransaction(firestore, async (t) => {
      const txDoc = await t.get(transactionRef);
      if (!txDoc.exists() || txDoc.data()?.status !== 'Pending') {
        throw new Error('Transaction not found or already processed.');
      }

      const txData = txDoc.data() as Transaction;
      const amount = Number(txData.amount);

      if (decision === 'approved') {
        if (txData.type === 'Deposit') {
          const balanceField = txData.targetAccount === 'annual' ? 'annualBalance' : 'solidaraBalance';
          t.update(userRef, { [balanceField]: increment(amount) });
        } else if (txData.type === 'Withdrawal') {
           t.update(userRef, { solidaraBalance: increment(-amount) });
        }
        t.update(transactionRef, { status: 'Completed' });
      } else { // Declined
        t.update(transactionRef, { status: 'Failed' });
      }
    });
    return { success: true };
  } catch (error: any) {
    console.error('Error updating transaction:', error);
    return { success: false, error: error.message || 'An unexpected error occurred.' };
  }
}
