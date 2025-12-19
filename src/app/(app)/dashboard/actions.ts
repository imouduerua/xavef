'use server';

import { z } from 'zod';
import { firestoreAdmin } from '@/firebase/admin';
import { getAuth } from 'firebase/auth';

const transferSchema = z.object({
  recipientId: z.string(),
  amount: z.number().positive(),
});

export async function makeTransfer(values: z.infer<typeof transferSchema>): Promise<{
  success: boolean;
  error?: string;
}> {
  const validation = transferSchema.safeParse(values);
  if (!validation.success) {
    return { success: false, error: 'Invalid input.' };
  }

  // In a real app, you would have logic here to:
  // 1. Authenticate the user
  // 2. Check if the user has sufficient balance
  // 3. Find the recipient by their ID
  // 4. Perform the database transaction to debit the sender and credit the recipient
  // 5. Record the transaction history

  console.log(
    `Simulating transfer of ₦${validation.data.amount} to ${validation.data.recipientId}`
  );

  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Simulate a potential error
  if (validation.data.recipientId === '0000') {
    return { success: false, error: 'This recipient is blocked.' };
  }

  return { success: true };
}


// Function to generate a unique 4 to 6 digit ID
async function generateUniqueXavefId(): Promise<string> {
  let xavefId;
  let isUnique = false;
  const usersRef = firestoreAdmin.collection('users');
  const length = Math.floor(Math.random() * 3) + 4; // 4, 5, or 6

  while (!isUnique) {
    xavefId = Math.floor(Math.pow(10, length - 1) + Math.random() * 9 * Math.pow(10, length - 1)).toString();
    const snapshot = await usersRef.where('xavefId', '==', xavefId).get();
    if (snapshot.empty) {
      isUnique = true;
    }
  }
  return xavefId!;
}

export async function createUserProfile(uid: string, email: string, displayName: string): Promise<{ success: boolean, error?: string }> {
    try {
        const userDocRef = firestoreAdmin.collection("users").doc(uid);

        // Check if the document already exists
        const docSnap = await userDocRef.get();
        if (docSnap.exists) {
            return { success: true }; // Profile already exists
        }

        const xavefId = await generateUniqueXavefId();

        await userDocRef.set({
            uid,
            email,
            displayName,
            xavefId,
            createdAt: new Date().toISOString(),
        });
        return { success: true };
    } catch (error: any) {
        console.error("Error creating user profile with Admin SDK:", error);
        return { success: false, error: error.message };
    }
}
