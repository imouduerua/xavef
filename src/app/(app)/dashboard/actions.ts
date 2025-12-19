'use server';

import { z } from 'zod';
import { firestoreAdmin } from '@/firebase/admin';

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

  console.log(
    `Simulating transfer of ₦${validation.data.amount} to ${validation.data.recipientId}`
  );

  await new Promise((resolve) => setTimeout(resolve, 1000));

  if (validation.data.recipientId === '0000') {
    return { success: false, error: 'This recipient is blocked.' };
  }

  return { success: true };
}

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

export async function createUserProfile(uid: string, email: string, displayName: string, referralCode?: string | null): Promise<{ success: boolean, error?: string }> {
    try {
        const userDocRef = firestoreAdmin.collection("users").doc(uid);
        const docSnap = await userDocRef.get();
        if (docSnap.exists) {
            return { success: true }; // Profile already exists
        }

        const xavefId = await generateUniqueXavefId();
        let referredBy: string | null = null;

        // Handle referral code
        if (referralCode) {
            const referralRef = firestoreAdmin.collection('referralCodes');
            const query = referralRef.where('code', '==', referralCode).where('used', '==', false);
            const snapshot = await query.limit(1).get();

            if (!snapshot.empty) {
                const referralDoc = snapshot.docs[0];
                referredBy = referralDoc.data().creatorUid;
                // Mark code as used in a transaction
                await firestoreAdmin.runTransaction(async (transaction) => {
                    transaction.update(referralDoc.ref, { used: true });
                });
            }
        }

        await userDocRef.set({
            uid,
            email,
            displayName,
            xavefId,
            createdAt: new Date().toISOString(),
            referredBy, // Add referredBy to the user document
        });

        return { success: true };
    } catch (error: any) {
        console.error("Error creating user profile with Admin SDK:", error);
        return { success: false, error: error.message };
    }
}
