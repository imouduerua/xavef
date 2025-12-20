'use server';

import { z } from 'zod';
import { firestoreAdmin } from '@/firebase/admin';
import { revalidatePath } from 'next/cache';
import { FieldValue } from 'firebase-admin/firestore';
import type { Transaction, UserData } from '@/lib/types';

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

      // Only allow updates on pending transactions
      if (txData.status !== 'Pending') {
        // This is not a fatal error, just a state mismatch. We can ignore it.
        console.log(`Transaction ${transactionId} is already ${txData.status}.`);
        return;
      }

      // If we are approving a pending deposit, update the user's balance.
      if (newStatus === 'Completed' && txData.type === 'Deposit') {
        const userDoc = await t.get(userRef);
        if (!userDoc.exists) {
          throw new Error("User profile not found for balance update.");
        }

        const amount = txData.amount;
        const targetAccount = txData.targetAccount;

        if (!targetAccount || (targetAccount !== 'solidara' && targetAccount !== 'annual')) {
          throw new Error(`Invalid target account '${targetAccount}' on transaction.`);
        }
        
        const balanceFieldToUpdate = `${targetAccount}Balance`;
        
        // Use FieldValue.increment for a safe, atomic update.
        t.update(userRef, {
          [balanceFieldToUpdate]: FieldValue.increment(amount)
        });
      }
      
      // Finally, update the transaction's status itself.
      t.update(transactionRef, { status: newStatus });
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
