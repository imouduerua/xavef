
'use server';

import { z } from 'zod';
import { firestoreAdmin } from '@/firebase/admin';
import { revalidatePath } from 'next/cache';
import { FieldValue } from 'firebase-admin/firestore';
import type { Transaction } from '@/lib/types';

const updateStatusSchema = z.object({
  userId: z.string().min(1),
  transactionId: z.string().min(1),
  newStatus: z.enum(['Completed', 'Failed']),
});

export async function updateTransactionStatus(values: z.infer<typeof updateStatusSchema>): Promise<{
  success: boolean;
  error?: string;
}> {
  const validation = updateStatusSchema.safeParse(values);
  if (!validation.success) {
    return { success: false, error: 'Invalid input.' };
  }

  const { userId, transactionId, newStatus } = validation.data;
  const transactionRef = firestoreAdmin.doc(`users/${userId}/transactions/${transactionId}`);
  const userRef = firestoreAdmin.doc(`users/${userId}`);

  try {
    const txDoc = await transactionRef.get();
    if (!txDoc.exists) {
      throw new Error("Transaction not found.");
    }
    const txData = txDoc.data() as Transaction;

    // If transaction is not pending, there's nothing to do.
    if (txData.status !== 'Pending') {
      return { success: true };
    }

    // If approving a deposit, update the balance first.
    if (newStatus === 'Completed' && txData.type === 'Deposit') {
      const amount = Number(txData.amount);
      const targetAccount = txData.targetAccount;

      if (isNaN(amount) || amount <= 0) {
        throw new Error('Invalid transaction amount.');
      }
      
      if (!targetAccount || (targetAccount !== 'solidara' && targetAccount !== 'annual')) {
        throw new Error(`Invalid or missing target account '${targetAccount}' on transaction.`);
      }
      
      const balanceFieldToUpdate = `${targetAccount}Balance`;
      
      // Update user balance
      await userRef.update({
        [balanceFieldToUpdate]: FieldValue.increment(amount)
      });
    }

    // Finally, update the transaction status
    await transactionRef.update({ status: newStatus });

    // Revalidate paths to ensure data is refreshed on the client-side
    revalidatePath('/admin/pending-transactions', 'page');
    revalidatePath('/dashboard', 'page');
    revalidatePath('/transactions', 'page');

    return { success: true };

  } catch (error: any) {
    console.error("[updateTransactionStatus] Error:", error);
    return { success: false, error: error.message || 'An unexpected server error occurred.' };
  }
}
