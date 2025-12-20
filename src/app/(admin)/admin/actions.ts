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
    await firestoreAdmin.runTransaction(async (t) => {
      const txDoc = await t.get(transactionRef);
      if (!txDoc.exists) {
        throw new Error("Transaction not found.");
      }
      const txData = txDoc.data() as Transaction;

      // Only proceed if the transaction is currently Pending
      if (txData.status !== 'Pending') {
        // If it's not pending, there's nothing to do. This is a successful state.
        console.log(`Transaction ${transactionId} is already ${txData.status}. No action taken.`);
        return;
      }
      
      // First, queue the transaction status update
      t.update(transactionRef, { status: newStatus });

      // If approved and it's a deposit, update the user's balance
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
        
        // Queue the balance update
        t.update(userRef, {
          [balanceFieldToUpdate]: FieldValue.increment(amount)
        });
      }
    });

    // Revalidate paths to ensure data is refreshed on the client-side
    revalidatePath('/admin/pending-transactions', 'page');
    revalidatePath('/dashboard', 'page');
    revalidatePath('/transactions', 'page');

    return { success: true };

  } catch (error: any) {
    console.error("Error updating transaction status:", error);
    return { success: false, error: error.message || 'An unexpected server error occurred.' };
  }
}
