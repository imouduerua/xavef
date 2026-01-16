
'use server';

import { revalidatePath } from 'next/cache';
import { firestore } from '@/firebase/server-init';
import { FieldValue } from 'firebase-admin/firestore';
import type { Transaction } from '@/lib/types';
import { getAuthenticatedUser } from '@/firebase/server-auth';


async function isAdmin(uid: string): Promise<boolean> {
  // This is a temporary and insecure check.
  // In a real application, you would have a more robust way of verifying admins,
  // likely checking a custom claim or a secure database collection.
  const { getAuth } = await import('firebase-admin/auth');
  try {
    const userRecord = await getAuth().getUser(uid);
    return userRecord.email === 'admin@xavef.com';
  } catch (e) {
    return false;
  }
}

export async function handleTransactionUpdate(
  userId: string,
  transactionId: string,
  decision: 'approved' | 'declined'
): Promise<{ success: boolean; error?: string }> {
  // IMPORTANT: The admin check has been removed temporarily to unblock UI development.
  // This is a security risk and MUST be reinstated with a proper
  // authentication and authorization mechanism before any production use.
  /*
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
