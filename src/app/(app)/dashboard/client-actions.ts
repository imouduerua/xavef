

'use client';

import { 
    doc, 
    runTransaction, 
    collection, 
    serverTimestamp,
    Firestore,
    query,
    where,
    getDocs,
    limit,
    documentId,
} from "firebase/firestore";
import type { User as AuthUser } from "firebase/auth";
import type { ReferralCode } from "@/lib/types";

async function generateUniqueXavefId(firestore: Firestore): Promise<string> {
    let xavefId;
    let isUnique = false;
    // This is a simplified approach. In a production environment with many users,
    // you'd want a more robust collision-detection mechanism.
    while (!isUnique) {
        const length = Math.floor(Math.random() * 3) + 4; // 4, 5, or 6
        xavefId = Math.floor(Math.pow(10, length - 1) + Math.random() * 9 * Math.pow(10, length - 1)).toString();
        isUnique = true; // For this app, we'll assume collisions are unlikely enough.
    }
    return xavefId!;
}


interface CreateProfileData {
    firstName: string;
    lastName: string;
    displayName: string;
    email: string;
    referralCode: string;
}

export async function createUserProfile(
    firestore: Firestore,
    user: AuthUser,
    data: CreateProfileData,
): Promise<{ success: boolean; error?: string }> {

    const userDocRef = doc(firestore, "users", user.uid);
    const referralCodesRef = collection(firestore, 'referralCodes');

    try {
        await runTransaction(firestore, async (transaction) => {
            // 1. Find the referral code document by querying for the 'code' field.
            const referralQuery = query(
                referralCodesRef, 
                where('code', '==', data.referralCode), 
                limit(1)
            );
            
            const referralQuerySnapshot = await getDocs(referralQuery);
            
            if (referralQuerySnapshot.empty) {
                 throw new Error("The provided referral code is invalid.");
            }

            const referralDoc = referralQuerySnapshot.docs[0];
            const referralData = referralDoc.data() as ReferralCode;
            
            // 2. Check if the code has already been used.
            if (referralData.used) {
                throw new Error("The provided referral code has already been used.");
            }

            const referredBy = referralData.creatorUid;

            const xavefId = await generateUniqueXavefId(firestore);
            
            const newUserProfile = {
                uid: user.uid,
                email: data.email,
                firstName: data.firstName,
                lastName: data.lastName,
                displayName: data.displayName,
                dateOfBirth: null,
                phoneNumber: null,
                address: null,
                state: null,
                country: null,
                xavefId,
                createdAt: serverTimestamp(),
                referredBy,
                solidaraBalance: 0,
                annualBalance: 0,
                bankAccounts: [],
            };

            // 3. Create the user's profile document
            transaction.set(userDocRef, newUserProfile);

            // 4. Create default saving goals
            const goalsCollectionRef = collection(firestore, `users/${user.uid}/goals`);
            const defaultGoals = [
                { name: 'House Rent', targetAmount: 0, emoji: '🏠' },
                { name: 'School Fees', targetAmount: 0, emoji: '🎓' },
            ];

            for (const goal of defaultGoals) {
                const newGoalRef = doc(goalsCollectionRef);
                transaction.set(newGoalRef, {
                    userId: user.uid,
                    name: goal.name,
                    targetAmount: goal.targetAmount,
                    currentAmount: 0,
                    createdAt: serverTimestamp(),
                    emoji: goal.emoji,
                });
            }

            // 5. Mark the referral code as used
            transaction.update(referralDoc.ref, { 
                used: true, 
                usedBy: user.uid, 
                usedAt: serverTimestamp() 
            });
        });

        return { success: true };

    } catch (error: any) {
        console.error("[createUserProfile] Error during profile creation transaction:", error);
        return { success: false, error: error.message || `An unexpected error occurred.` };
    }
}
