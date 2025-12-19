'use server';

import { z } from 'zod';
import { firestoreAdmin } from '@/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

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
            console.log(`Profile for user ${uid} already exists.`);
            return { success: true }; 
        }

        console.log(`Creating profile for new user ${uid}...`);

        const xavefId = await generateUniqueXavefId();
        let referredBy: string | null = null;

        if (referralCode) {
            console.log(`Attempting to process referral code: ${referralCode}`);
            const referralRef = firestoreAdmin.collection('referralCodes').where('code', '==', referralCode).where('used', '==', false);
            const snapshot = await referralRef.limit(1).get();

            if (!snapshot.empty) {
                const referralDoc = snapshot.docs[0];
                referredBy = referralDoc.data().creatorUid;
                console.log(`Referral code is valid. Referred by: ${referredBy}. Marking code as used.`);
                // Use Admin SDK to update the referral code, bypassing security rules
                await referralDoc.ref.update({ used: true });
            } else {
                console.log("Referral code not found or already used.");
            }
        }

        await userDocRef.set({
            uid,
            email,
            displayName,
            xavefId,
            createdAt: FieldValue.serverTimestamp(), // Use server timestamp for accuracy
            referredBy,
        });

        console.log(`Successfully created profile for user ${uid}.`);
        return { success: true };
    } catch (error: any) {
        console.error("Error creating user profile with Admin SDK:", error);
        return { success: false, error: "An unexpected error occurred while creating your profile. Please contact support." };
    }
}
