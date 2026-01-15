
'use server';

import { revalidatePath } from 'next/cache';
import { doc, getDoc, runTransaction, increment, collection, writeBatch, serverTimestamp } from 'firebase/firestore';
import { firestore } from '@/firebase/server-init';
import { getAuthenticatedUser } from '@/firebase/server-auth';
import type { UserData, TransactionWithUserDetails, Transaction } from '@/lib/types';


async function isAdmin(uid: string): Promise<boolean> {
  const superAdminUid = process.env.FIREBASE_SUPER_ADMIN_UID;
  if (uid === superAdminUid) {
    return true;
  }
  try {
    const adminDoc = await firestore.collection('admins').doc(uid).get();
    return adminDoc.exists && adminDoc.data()?.isAdmin === true;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

export async function handleTransactionUpdate(
  userId: string,
  transactionId: string,
  decision: 'approved' | 'declined'
): Promise<{ success: boolean; error?: string }> {
  const user = await getAuthenticatedUser();
  if (!user || !(await isAdmin(user.uid))) {
    return { success: false, error: 'Permission denied. You must be an admin to perform this action.' };
  }

  const transactionRef = doc(firestore, `users/${userId}/transactions`, transactionId);
  const userRef = doc(firestore, 'users', userId);

  try {
    await runTransaction(firestore, async (transaction) => {
      const txDoc = await transaction.get(transactionRef);
      if (!txDoc.exists || txDoc.data()?.status !== 'Pending') {
        throw new Error('Transaction not found or already processed.');
      }

      const txData = txDoc.data() as Transaction;
      const amount = Number(txData.amount);

      if (decision === 'approved') {
        if (txData.type === 'Deposit') {
          const balanceField = txData.targetAccount === 'annual' ? 'annualBalance' : 'solidaraBalance';
          transaction.update(userRef, { [balanceField]: increment(amount) });
        } else if (txData.type === 'Withdrawal') {
           transaction.update(userRef, { solidaraBalance: increment(-amount) });
        }
        transaction.update(transactionRef, { status: 'Completed' });
      } else { // Declined
        transaction.update(transactionRef, { status: 'Failed' });
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
