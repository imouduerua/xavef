
'use server';

import { z } from 'zod';
import { authAdmin, firestoreAdmin } from '@/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import { revalidatePath } from 'next/cache';

const bankAccountSchema = z.object({
  bankName: z.string(),
  accountName: z.string(),
  bankAccountNumber: z.string(),
});

const withdrawalSchema = z.object({
  amount: z.number().positive(),
  destinationBank: bankAccountSchema,
  uid: z.string().min(1, "User ID is required."),
});

export async function requestWithdrawal(
  values: z.infer<typeof withdrawalSchema>
): Promise<{ success: boolean; error?: string }> {
  const validation = withdrawalSchema.safeParse(values);
  if (!validation.success) {
    return { success: false, error: 'Invalid input.' };
  }

  try {
    const { amount, destinationBank, uid } = validation.data;

    const userDocRef = firestoreAdmin.collection('users').doc(uid);
    const transactionRef = userDocRef.collection('transactions');

    const userDoc = await userDocRef.get();
    if (!userDoc.exists()) {
      throw new Error('User profile not found.');
    }
    const userData = userDoc.data();
    if (userData?.solidaraBalance < amount) {
        throw new Error('Insufficient balance for this withdrawal request.');
    }

    const newTransaction = {
      date: FieldValue.serverTimestamp(),
      amount: -amount, // Withdrawals are negative amounts
      description: `Withdrawal to ${destinationBank.bankName}`,
      type: 'Withdrawal',
      status: 'Pending',
      targetAccount: 'solidara', // Withdrawals are from solidara account
      // We can store the destination account info for the admin's reference
      destinationBankName: destinationBank.bankName,
      destinationAccountName: destinationBank.accountName,
      destinationAccountNumber: destinationBank.bankAccountNumber,
    };

    await transactionRef.add(newTransaction);
    
    // Revalidate the transactions page to show the new pending transaction
    revalidatePath('/transactions');
    revalidatePath('/dashboard');
    
    return { success: true };

  } catch (error: any) {
    console.error('Error requesting withdrawal:', error);
    return { success: false, error: error.message || 'An unexpected server error occurred.' };
  }
}
