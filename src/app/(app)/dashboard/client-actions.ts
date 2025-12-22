

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
    increment,
} from "firebase/firestore";
import type { User as AuthUser } from "firebase/auth";
import type { ReferralCode, UserData } from "@/lib/types";

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

export async function findUserByXavefIdClient(firestore: Firestore, xavefId: string, senderUid: string): Promise<{ success: boolean; name?: string; error?: string }> {
    if (!xavefId) {
        return { success: false, error: 'Xavef ID is required.' };
    }
     if (!senderUid) {
        return { success: false, error: 'Sender not identified.' };
    }

    try {
        const usersRef = collection(firestore, 'users');
        const q = query(
            usersRef, 
            where('xavefId', '==', xavefId), 
            where(documentId(), '!=', senderUid),
            limit(1)
        );

        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            return { success: false, error: 'User not found.' };
        }

        const userData = querySnapshot.docs[0].data() as UserData;
        
        const fullName = (userData.firstName && userData.lastName) 
            ? `${userData.firstName} ${userData.lastName}`.trim()
            : userData.displayName;
        
        if (!fullName) {
             return { success: false, error: 'User name not available.' };
        }
        
        return { success: true, name: fullName };

    } catch (error) {
        console.error('Error finding user by Xavef ID:', error);
        return { success: false, error: 'An unexpected error occurred.' };
    }
}


export async function createUserProfile(
    firestore: Firestore,
    user: AuthUser,
    data: CreateProfileData,
): Promise<{ success: boolean; error?: string }> {

    const userDocRef = doc(firestore, "users", user.uid);
    const referralCodesRef = collection(firestore, 'referralCodes');

    try {
        const transactionResult = await runTransaction(firestore, async (transaction) => {
            // 1. Find the referral code document by querying for the 'code' field.
            const referralQuery = query(
                referralCodesRef, 
                where('code', '==', data.referralCode), 
                limit(1)
            );
            
            // Note: getDocs cannot be used inside a transaction's read phase if it's not reading from the transaction.
            // However, for this check, we perform it outside the main atomic write operations. This is a common pattern.
            const referralQuerySnapshot = await getDocs(referralQuery);
            
            if (referralQuerySnapshot.empty) {
                 // By returning a specific object, we can provide a clean error to the caller.
                 return { success: false, error: "The provided referral code is invalid." };
            }

            const referralDoc = referralQuerySnapshot.docs[0];
            const referralData = referralDoc.data() as ReferralCode;
            
            // 2. Check if the code has already been used.
            if (referralData.used) {
                return { success: false, error: "The provided referral code has already been used." };
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
            
            // Return a success indicator from the transaction
            return { success: true };
        });
        
        // After the transaction, check the result and return it.
        if (!transactionResult.success) {
            return { success: false, error: transactionResult.error };
        }

        return { success: true };

    } catch (error: any) {
        console.error("[createUserProfile] Error during profile creation transaction:", error);
        // This will now only catch unexpected transaction failures (e.g. network issues, security rules),
        // not our validation logic.
        return { success: false, error: `An unexpected error occurred during profile creation.` };
    }
}


export async function makeTransferClient(firestore: Firestore, data: {
  senderUid: string;
  recipientXavefId: string;
  amount: number;
}): Promise<{ success: boolean; error?: string }> {
  
    const { senderUid, recipientXavefId, amount } = data;

    if (amount <= 0) {
        return { success: false, error: 'Transfer amount must be positive.' };
    }

    try {
        // Find recipient by xavefId
        const usersRef = collection(firestore, 'users');
        const recipientQuery = query(usersRef, where('xavefId', '==', recipientXavefId), where(documentId(), '!=', senderUid));
        const recipientSnapshot = await getDocs(recipientQuery);

        if (recipientSnapshot.empty) {
            return { success: false, error: 'Recipient with that Xavef ID not found.' };
        }

        const recipient = recipientSnapshot.docs[0].data() as UserData;
        const recipientUid = recipientSnapshot.docs[0].id;
        
        const senderRef = doc(firestore, 'users', senderUid);
        const recipientRef = doc(firestore, 'users', recipientUid);
        
        await runTransaction(firestore, async (transaction) => {
            const senderDoc = await transaction.get(senderRef);
            if (!senderDoc.exists()) {
                throw new Error('Sender not found.');
            }

            const senderData = senderDoc.data() as UserData;
            if (senderData.solidaraBalance < amount) {
                throw new Error('Insufficient funds.');
            }
            
            // 1. Debit the sender
            transaction.update(senderRef, { solidaraBalance: increment(-amount) });

            // 2. Credit the recipient
            transaction.update(recipientRef, { solidaraBalance: increment(amount) });
            
            const timestamp = serverTimestamp();

            // 3. Create sender's transaction record
            const senderTxRef = doc(collection(senderRef, 'transactions'));
            transaction.set(senderTxRef, {
                amount: -amount,
                date: timestamp,
                description: `Transfer to ${recipient.displayName || 'user'} (${recipientXavefId})`,
                type: 'User Transfer',
                status: 'Completed',
                targetAccount: 'solidara'
            });

            // 4. Create recipient's transaction record
            const recipientTxRef = doc(collection(recipientRef, 'transactions'));
            transaction.set(recipientTxRef, {
                amount: amount,
                date: timestamp,
                description: `Transfer from ${senderData.displayName || 'user'}`,
                type: 'User Transfer',
                status: 'Completed',
                targetAccount: 'solidara'
            });

            // 5. (Optional but good practice) Create a root-level transfer record
            const transferRecordRef = doc(collection(firestore, 'transfers'));
            transaction.set(transferRecordRef, {
                senderUid,
                recipientUid,
                amount,
                createdAt: timestamp,
                status: 'completed'
            });
        });

        return { success: true };

    } catch (error: any) {
        console.error('Error during user transfer:', error);
        return { success: false, error: error.message || 'An unexpected error occurred during the transfer.' };
    }
}
