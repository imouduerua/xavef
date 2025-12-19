'use server';

import { z } from 'zod';
import { firestoreAdmin } from '@/firebase/admin';
import { revalidatePath } from 'next/cache';

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

  try {
    // In a real app, you MUST verify admin permissions here before proceeding.
    // For example: check if the calling user is an admin.
    // We are trusting the security rules for this demo.

    await firestoreAdmin.runTransaction(async (transaction) => {
        const txDoc = await transaction.get(transactionRef);
        if (!txDoc.exists) {
            throw new Error("Transaction not found.");
        }
        
        const currentStatus = txDoc.data()?.status;
        if (currentStatus !== 'Pending') {
            throw new Error(`Transaction is already ${currentStatus}.`);
        }

        // TODO: If the transaction is approved ('Completed'), this is where you would
        // also update the user's main account balance. This requires careful
        // handling of balances in a separate document to avoid race conditions.
        // For this example, we will only update the transaction status.

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
