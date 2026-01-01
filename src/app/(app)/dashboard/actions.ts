

'use server';

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
        
        const q = query(collection(firestore, 'users'), where('xavefId', '==', xavefId), limit(1));
        const snapshot = await getDocs(q);
        if (snapshot.empty) {
            isUnique = true;
        }
    }
    return xavefId!;
}


interface CreateProfileData {
    firstName: string;
    lastName: string;
    displayName: string;
    email: string;
    referralCode?: string;
}

export async function createUserProfile(
  firestore: Firestore,
  user: AuthUser,
  data: CreateProfileData
): Promise<{ success: boolean; error?: string }> {
  const userDocRef = doc(firestore, 'users', user.uid);

  try {
    await runTransaction(firestore, async (transaction) => {
      const xavefId = await generateUniqueXavefId(firestore);
      let referredBy: string | null = null;

      // Handle referral code if provided
      if (data.referralCode) {
        const codeQuery = query(
          collection(firestore, 'referralCodes'),
          where('code', '==', data.referralCode.trim().toUpperCase()),
          limit(1)
        );
        const codeSnap = await getDocs(codeQuery); // Use getDocs within a transaction
        
        if (codeSnap.empty) {
          throw new Error('Invalid referral code.');
        }
        
        const codeDoc = codeSnap.docs[0];
        const codeData = codeDoc.data() as ReferralCode;

        if (codeData.used) {
          throw new Error('This referral code has already been used.');
        }

        // Set the referrer and mark the code as used
        referredBy = codeData.creatorUid;
        transaction.update(codeDoc.ref, { used: true });
      }

      const newUserProfile: UserData = {
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
        referredBy: referredBy,
        solidaraBalance: 0,
        annualBalance: 0,
        bankAccounts: [],
      };

      transaction.set(userDocRef, newUserProfile);
    });

    return { success: true };
  } catch (error: any) {
    console.error(
      '[createUserProfile] Error during profile creation:',
      error
    );
    return {
      success: false,
      error: error.message || `An unexpected error occurred during profile creation.`,
    };
  }
}

export async function transferToAnnual(
  firestore: Firestore,
  userId: string,
  amount: number
): Promise<{ success: boolean; error?: string }> {
    const userDocRef = doc(firestore, 'users', userId);
    const userTransactionsRef = collection(userDocRef, 'transactions');

    try {
        await runTransaction(firestore, async (transaction) => {
            const userSnap = await transaction.get(userDocRef);
            if (!userSnap.exists()) {
                throw new Error("User not found.");
            }

            const userData = userSnap.data() as UserData;
            if (userData.solidaraBalance < amount) {
                throw new Error("Insufficient Olidara balance.");
            }

            // 1. Debit Olidara and credit Annual
            transaction.update(userDocRef, {
                solidaraBalance: increment(-amount),
                annualBalance: increment(amount)
            });

            // 2. Create a transaction record
            const newTxRef = doc(userTransactionsRef);
            transaction.set(newTxRef, {
                amount: amount,
                date: serverTimestamp(),
                description: "Transfer to Annual Savings",
                type: 'Internal Transfer',
                status: 'Completed', // Set status to Completed directly
                targetAccount: 'annual',
            });
        });
        return { success: true };
    } catch (error: any) {
        console.error('Error transferring to annual account:', error);
        return { success: false, error: error.message || "Failed to complete transfer." };
    }
}
