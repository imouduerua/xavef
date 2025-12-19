
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

export async function createUserProfile(uid: string, email: string, referralCode: string | null): Promise<{ success: boolean, error?: string }> {
    console.log(`[createUserProfile] Starting profile creation for uid: ${uid}`);
    
    if (!referralCode) {
        console.error("[createUserProfile] CRITICAL ERROR: No referral code provided.");
        return { success: false, error: "A referral code is required to create a profile." };
    }

    const userDocRef = firestoreAdmin.collection("users").doc(uid);
    const referralDocRef = firestoreAdmin.collection('referralCodes').doc(referralCode);

    try {
        const result = await firestoreAdmin.runTransaction(async (transaction) => {
            console.log("[createUserProfile] Running transaction...");

            const userDoc = await transaction.get(userDocRef);
            if (userDoc.exists) {
                console.log(`[createUserProfile] Profile for user ${uid} already exists. Aborting transaction.`);
                return { success: true }; 
            }

            console.log(`[createUserProfile] Processing referral code: ${referralCode}`);
            const referralDoc = await transaction.get(referralDocRef);

            if (!referralDoc.exists || referralDoc.data()?.used) {
                console.log("[createUserProfile] Referral code not found, is invalid, or has already been used.");
                throw new Error("The provided referral code is either invalid or has already been used.");
            }
            
            const referredBy = referralDoc.data()?.creatorUid;
            console.log(`[createUserProfile] Referral code is valid. Referred by: ${referredBy}.`);

            const xavefId = await generateUniqueXavefId();
            
            const newUser = {
                uid,
                email,
                firstName: "",
                lastName: "",
                dateOfBirth: null,
                phoneNumber: null,
                address: null,
                state: null,
                country: null,
                xavefId,
                createdAt: FieldValue.serverTimestamp(),
                referredBy,
            };

            console.log(`[createUserProfile] Creating user document for ${uid} within transaction.`);
            transaction.set(userDocRef, newUser);

            console.log(`[createUserProfile] Marking referral code ${referralCode} as used within transaction.`);
            transaction.update(referralDocRef, { used: true });

            console.log("[createUserProfile] Transaction operations queued.");
            return { success: true };
        });

        console.log(`[createUserProfile] Transaction successful for user ${uid}.`);
        return result;

    } catch (error: any) {
        console.error("[createUserProfile] CRITICAL ERROR during profile creation transaction:", error);
        return { success: false, error: error.message || `An unexpected error occurred during profile creation.` };
    }
}
