
'use server';

import { revalidatePath } from 'next/cache';
import { firestore } from '@/firebase/server-init';
import { FieldValue } from 'firebase-admin/firestore';
import type { Transaction } from '@/lib/types';

export async function handleTransactionUpdate(
  userId: string,
  transactionId: string,
  decision: 'approved' | 'declined'
): Promise<{ success: boolean; error?: string }> {
  // IMPORTANT: A proper admin check is required for production environments.
  // This temporary implementation is for UI development and is not secure.
  /*
  const { getAuthenticatedUser } = await import('@/firebase/server-auth');
  const user = await getAuthenticatedUser();
  if (!user || user.email !== 'admin@xavef.com') {
    return { success: false, error: 'Permission denied. You must be an admin to perform this action.' };
  }
  */

  const transactionRef = firestore.collection('users').doc(userId).collection('transactions').doc(transactionId);
  const userRef = firestore.collection('users').doc(userId);

  try {
    await firestore.runTransaction(async (t) => {
      const txDoc = await t.get(transactionRef);
      if (!txDoc.exists || txDoc.data()?.status !== 'Pending') {
        throw new Error('Transaction not found or already processed.');
      }

      const txData = txDoc.data() as Transaction;
      const amount = Number(txData.amount);

      if (decision === 'approved') {
        if (txData.type === 'Deposit') {
          const balanceField = txData.targetAccount === 'annual' ? 'annualBalance' : 'solidaraBalance';
          t.update(userRef, { [balanceField]: FieldValue.increment(amount) });
        } else if (txData.type === 'Withdrawal') {
           // For withdrawals, `amount` is positive, so we debit it.
           t.update(userRef, { solidaraBalance: FieldValue.increment(-amount) });
        }
        t.update(transactionRef, { status: 'Completed' });
      } else { // Declined
        t.update(transactionRef, { status: 'Failed' });
      }
    });

    revalidatePath('/admin/dashboard');
    revalidatePath('/admin/transactions');
    return { success: true };
  } catch (error: any) {
    console.error('Error updating transaction:', error);
    return { success: false, error: error.message || 'An unexpected error occurred.' };
  }
}
