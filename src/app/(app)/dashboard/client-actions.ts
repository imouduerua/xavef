

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
    addDoc,
    getDoc,
    writeBatch,
} from "firebase/firestore";
import type { User as AuthUser } from "firebase/auth";
import type { ReferralCode, UserData, BankAccount } from "@/lib/types";

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
            
            const referralQuerySnapshot = await getDocs(referralQuery);
            
            if (referralQuerySnapshot.empty) {
                 return { success: false, error: "The provided referral code is invalid." };
            }

            const referralDoc = referralQuerySnapshot.docs[0];
            const referralData = referralDoc.data() as ReferralCode;
            
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

            transaction.set(userDocRef, newUserProfile);

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

            transaction.update(referralDoc.ref, { 
                used: true, 
                usedBy: user.uid, 
                usedAt: serverTimestamp() 
            });
            
            return { success: true };
        });
        
        if (!transactionResult.success) {
            return { success: false, error: transactionResult.error };
        }

        return { success: true };

    } catch (error: any) {
        console.error("[createUserProfile] Error during profile creation transaction:", error);
        return { success: false, error: `An unexpected error occurred during profile creation.` };
    }
}

export async function makeTransferClient(firestore: Firestore, data: {
  senderUid: string;
  recipientXavefId: string;
  recipientName: string;
  amount: number;
}): Promise<{ success: boolean; error?: string }> {
  
  const { senderUid, recipientXavefId, amount, recipientName } = data;

  if (amount <= 0) {
    return { success: false, error: 'Transfer amount must be positive.' };
  }

  const senderRef = doc(firestore, 'users', senderUid);
  
  try {
    const senderDoc = await getDoc(senderRef);
    if (!senderDoc.exists() || senderDoc.data().solidaraBalance < amount) {
      return { success: false, error: 'Insufficient funds.' };
    }

    const transactionRef = collection(firestore, `users/${senderUid}/transactions`);
    
    // Create a PENDING transaction for the sender. The admin will approve this.
    await addDoc(transactionRef, {
      date: serverTimestamp(),
      amount: -amount, // Debited from sender
      description: `Transfer to ${recipientName} (${recipientXavefId})`,
      type: 'User Transfer',
      status: 'Pending',
      targetAccount: 'solidara',
      // Add recipient info for the admin to process the transfer
      recipientXavefId: recipientXavefId, 
      recipientName: recipientName,
    });
        
    return { success: true };

  } catch (error: any) {
    console.error('Error during user transfer request:', error);
    return { success: false, error: error.message || 'An unexpected error occurred during the transfer.' };
  }
}
