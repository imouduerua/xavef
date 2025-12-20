'use server';

import { z } from 'zod';
import { firestoreAdmin } from '@/firebase/admin';
import { revalidatePath } from 'next/cache';
import { FieldValue } from 'firebase-admin/firestore';
import type { AccountType } from '@/lib/types';

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
    await firestoreAdmin.runTransaction(async (transaction) => {
        const txDoc = await transaction.get(transactionRef);
        if (!txDoc.exists) {
            throw new Error("Transaction not found.");
        }
        
        const txData = txDoc.data();
        if (txData?.status !== 'Pending') {
            throw new Error(`Transaction is already ${txData?.status}.`);
        }

        // If approving a deposit, update the user's balance.
        if (newStatus === 'Completed' && txData.type === 'Deposit') {
          const userDoc = await transaction.get(userRef);
          if (!userDoc.exists) {
            throw new Error("User not found to update balance.");
          }

          const amount = txData.amount;
          const targetAccount = txData.targetAccount as AccountType;

          if (!targetAccount || (targetAccount !== 'solidara' && targetAccount !== 'annual')) {
            throw new Error(`Invalid target account on transaction: ${targetAccount}`);
          }
          
          const balanceFieldToUpdate = `${targetAccount}Balance`;
          
          transaction.update(userRef, {
            [balanceFieldToUpdate]: FieldValue.increment(amount)
          });
        }
        
        // Update the transaction status for both 'Completed' and 'Failed'
        transaction.update(transactionRef, { status: newStatus });
    });

    // Revalidate the path to ensure the admin sees the updated list
    revalidatePath('/admin/pending-transactions');

    return { success: true };

  } catch (error: any) {
    console.error("Error updating transaction status:", error);
    return { success: false, error: error.message || 'An unexpected server error occurred.' };
  }
}
