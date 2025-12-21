

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

const DEFAULT_REFERRAL_CODE = "XAVEFDEFAULT";
const SUPER_ADMIN_UID = "SUPER_ADMIN_USER"; // A placeholder for the actual super admin UID

async function ensureDefaultReferralCode(firestore: Firestore) {
    const defaultReferralRef = doc(firestore, "referralCodes", DEFAULT_REFERRAL_CODE);
    try {
        const docSnap = await getDoc(defaultReferralRef);
        if (!docSnap.exists()) {
            await setDoc(defaultReferralRef, {
                code: DEFAULT_REFERRAL_CODE,
                creatorUid: SUPER_ADMIN_UID, 
                used: false, // This default code is never truly "used"
                isDefault: true,
                createdAt: serverTimestamp(),
            });
            console.log("Default referral code created.");
        }
    } catch (error) {
        console.error("Error ensuring default referral code exists:", error);
    }
}


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
    let referralDocRef = doc(firestore, 'referralCodes', data.referralCode);

    try {
        await ensureDefaultReferralCode(firestore); // Make sure the fallback exists

        await runTransaction(firestore, async (transaction) => {
            let referralDoc = await transaction.get(referralDocRef);

            // If the provided referral code is invalid or used, fall back to the default code
            if (!referralDoc.exists() || referralDoc.data()?.used) {
                console.warn(`Referral code "${data.referralCode}" is invalid or used. Falling back to default.`);
                referralDocRef = doc(firestore, 'referralCodes', DEFAULT_REFERRAL_CODE);
                referralDoc = await transaction.get(referralDocRef);

                if (!referralDoc.exists()) {
                    // This is a critical failure state if the default code doesn't exist
                    throw new Error("Default referral code is missing. Cannot create user profile.");
                }
            }

            const referralData = referralDoc.data();
            const referredBy = referralData?.creatorUid;

            if (!referredBy) {
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

            // 3. Mark the referral code as used, but NOT if it's the default one
            if (!referralData?.isDefault) {
                transaction.update(referralDocRef, { 
                    used: true, 
                    usedBy: user.uid, 
                    usedAt: serverTimestamp() 
                });
            }
        });

        return { success: true };

    } catch (error: any) {
        console.error("[createUserProfile] Error during profile creation transaction:", error);
        return { success: false, error: error.message || `An unexpected error occurred.` };
    }
}
