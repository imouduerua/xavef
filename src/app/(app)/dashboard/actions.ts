
'use server';

import { z } from 'zod';
import { firestoreAdmin } from '@/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import { revalidatePath } from 'next/cache';

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

export async function createUserProfile(uid: string, email: string, displayName: string, referralCode: string | null): Promise<{ success: boolean, error?: string }> {
    if (!referralCode) {
        return { success: false, error: "A referral code is required to create a profile." };
    }

    const userDocRef = firestoreAdmin.collection("users").doc(uid);
    const referralDocRef = firestoreAdmin.collection('referralCodes').doc(referralCode);
    const goalsCollectionRef = userDocRef.collection('goals');


    try {
        const result = await firestoreAdmin.runTransaction(async (transaction) => {
            const userDoc = await transaction.get(userDocRef);
            if (userDoc.exists) {
                // This case should ideally not be hit if called right after registration,
                // but it's a good safeguard.
                return { success: true }; 
            }

            const referralDoc = await transaction.get(referralDocRef);

            if (!referralDoc.exists || referralDoc.data()?.used) {
                throw new Error("The provided referral code is either invalid or has already been used.");
            }
            
            const referredBy = referralDoc.data()?.creatorUid;
            const xavefId = await generateUniqueXavefId();

            const nameParts = displayName.split(' ');
            const firstName = nameParts[0] || '';
            const lastName = nameParts.slice(1).join(' ') || '';
            
            const newUser = {
                uid,
                email,
                firstName,
                lastName,
                displayName,
                dateOfBirth: null,
                phoneNumber: null,
                address: null,
                state: null,
                country: null,
                xavefId,
                createdAt: FieldValue.serverTimestamp(),
                referredBy,
                solidaraBalance: 0,
                annualBalance: 0,
                bankAccounts: [],
            };

            transaction.set(userDocRef, newUser);

            const defaultGoals = [
                { name: 'House Rent', targetAmount: 0 },
                { name: 'School Fees', targetAmount: 0 },
            ];

            for (const goal of defaultGoals) {
                const newGoalRef = goalsCollectionRef.doc();
                transaction.set(newGoalRef, {
                    userId: uid,
                    name: goal.name,
                    targetAmount: goal.targetAmount,
                    currentAmount: 0,
                    targetDate: null,
                    createdAt: FieldValue.serverTimestamp(),
                });
            }

            transaction.update(referralDocRef, { used: true });

            return { success: true };
        });

        // No revalidate needed here, client will get data on redirect.
        return result;

    } catch (error: any) {
        console.error("[createUserProfile] CRITICAL ERROR during profile creation transaction:", error);
        return { success: false, error: error.message || `An unexpected error occurred during profile creation.` };
    }
}
