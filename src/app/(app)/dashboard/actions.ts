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
  
  while (!isUnique) {
    const length = Math.floor(Math.random() * 3) + 4; // 4, 5, or 6
    xavefId = Math.floor(Math.pow(10, length - 1) + Math.random() * 9 * Math.pow(10, length - 1)).toString();
    const snapshot = await usersRef.where('xavefId', '==', xavefId).get();
    if (snapshot.empty) {
      isUnique = true;
    }
  }
  return xavefId!;
}

export async function createUserProfile(uid: string, email: string, displayName: string, referralCode?: string | null): Promise<{ success: boolean, error?: string }> {
    const userDocRef = firestoreAdmin.collection("users").doc(uid);

    try {
        console.log(`[createUserProfile] Starting transaction for user: ${uid}`);
        await firestoreAdmin.runTransaction(async (transaction) => {
            const userDoc = await transaction.get(userDocRef);

            if (userDoc.exists) {
                console.log(`[createUserProfile] Profile for user ${uid} already exists. Aborting.`);
                return;
            }

            console.log(`[createUserProfile] Generating Xavef ID for user ${uid}.`);
            const xavefId = await generateUniqueXavefId();
            let referredBy: string | null = null;

            if (referralCode) {
                console.log(`[createUserProfile] Processing referral code: ${referralCode}`);
                const referralDocRef = firestoreAdmin.collection('referralCodes').doc(referralCode);
                const referralDoc = await transaction.get(referralDocRef);

                if (referralDoc.exists && !referralDoc.data()?.used) {
                    referredBy = referralDoc.data()?.creatorUid;
                    console.log(`[createUserProfile] Referral code is valid. Referred by: ${referredBy}. Marking code as used.`);
                    transaction.update(referralDocRef, { used: true });
                } else {
                    console.log("[createUserProfile] Referral code not found, is invalid, or has already been used.");
                    // We don't throw an error here, just proceed without the referral
                }
            }
            
            const newUser = {
                uid,
                email,
                displayName,
                xavefId,
                createdAt: FieldValue.serverTimestamp(),
                referredBy,
            };

            console.log(`[createUserProfile] Creating user document for ${uid} with data:`, newUser);
            transaction.set(userDocRef, newUser);
        });

        console.log(`[createUserProfile] Transaction successful for user ${uid}.`);
        return { success: true };
    } catch (error: any) {
        console.error("[createUserProfile] Error in transaction:", error);
        return { success: false, error: `An unexpected error occurred: ${error.message}` };
    }
}
