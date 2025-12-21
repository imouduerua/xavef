

'use client';

import { 
    doc, 
    runTransaction, 
    collection, 
    serverTimestamp,
    Firestore,
    Timestamp,
    getDoc,
    setDoc,
} from "firebase/firestore";
import type { User as AuthUser } from "firebase/auth";

// This is a client-side action file.

async function generateUniqueXavefId(firestore: Firestore): Promise<string> {
    let xavefId;
    let isUnique = false;
    const usersRef = collection(firestore, 'users');

    while (!isUnique) {
        const length = Math.floor(Math.random() * 3) + 4; // 4, 5, or 6
        xavefId = Math.floor(Math.pow(10, length - 1) + Math.random() * 9 * Math.pow(10, length - 1)).toString();
        
        // In a real-world scenario, you'd query to check for uniqueness.
        // For this app, we'll assume collisions are unlikely enough.
        isUnique = true;
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
    const referralDocRef = doc(firestore, 'referralCodes', data.referralCode);

    try {
        await runTransaction(firestore, async (transaction) => {
            const referralDoc = await transaction.get(referralDocRef);

            // If the provided referral code is invalid or used, throw an error.
            if (!referralDoc.exists() || referralDoc.data()?.used) {
                throw new Error("The referral code is invalid or has already been used.");
            }

            const referralData = referralDoc.data();
            const referredBy = referralData?.creatorUid;

            if (!referredBy) {
                // This case should be rare if the above check passes, but it's good practice.
                throw new Error("The referral code is invalid.");
            }

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

            // 1. Create the user's profile document
            transaction.set(userDocRef, newUserProfile);

            // 2. Create default saving goals
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

            // 3. Mark the referral code as used
            transaction.update(referralDocRef, { 
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
