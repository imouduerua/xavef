
'use server';

import { 
    doc, 
    runTransaction, 
    collection, 
    Timestamp,
    query,
    where,
    getDocs,
    limit,
    increment,
    writeBatch,
    getDoc,
} from "firebase/firestore";
import type { ReferralCode, UserData, BankAccount } from "@/lib/types";
import { v4 as uuidv4 } from 'uuid';
import { firestore } from '@/firebase/server-init';


interface CreateProfileData {
    firstName: string;
    lastName: string;
    displayName: string;
    email: string;
    referralCode?: string;
}

export async function createUserProfile(
  uid: string,
  data: CreateProfileData
): Promise<{ success: boolean; error?: string }> {
  // Gracefully fail if server is not configured.
  if (!firestore) {
    return {
        success: false,
        error: "Server is not configured for database access. Please contact support."
    }
  }

  const userDocRef = doc(firestore, 'users', uid);
  let referredBy: string | null = null;
  let referralCodeDocId: string | null = null;

  try {
    // Perform all read operations BEFORE the transaction
    if (data.referralCode) {
      const codeQuery = query(
        collection(firestore, 'referralCodes'),
        where('code', '==', data.referralCode.trim().toUpperCase()),
        where('used', '==', false),
        limit(1)
      );
      const codeSnap = await getDocs(codeQuery);

      if (codeSnap.empty) {
        throw new Error('Invalid or already used referral code.');
      }
      
      const codeDoc = codeSnap.docs[0];
      const codeData = codeDoc.data() as ReferralCode;
      
      referredBy = codeData.creatorUid;
      referralCodeDocId = codeDoc.id; // Get the ID to reference inside the transaction
    }

    const xavefId = uuidv4().substring(0, 6).toUpperCase();

    // Now, perform all write operations within the transaction
    await runTransaction(firestore, async (transaction) => {
      
      const newUserProfile: UserData = {
        uid: uid,
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
        createdAt: Timestamp.now(),
        referredBy: referredBy,
        solidaraBalance: 0,
        annualBalance: 0,
        bankAccounts: [],
      };

      // 1. Create the new user profile
      transaction.set(userDocRef, newUserProfile);

      // 2. If a referral code was used, mark it as used
      if (referralCodeDocId) {
        const codeRef = doc(firestore, 'referralCodes', referralCodeDocId);
        transaction.update(codeRef, { used: true });
      }
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
  userId: string,
  amount: number
): Promise<{ success: boolean; error?: string }> {
    if (!firestore) {
      return {
          success: false,
          error: "Server is not configured for database access. Please contact support."
      }
    }
    
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
                date: Timestamp.now(),
                description: "Transfer to Annual Savings",
                type: 'Internal Transfer',
                status: 'Completed',
                targetAccount: 'annual',
            });
        });
        return { success: true };
    } catch (error: any) {
        console.error('Error transferring to annual account:', error);
        return { success: false, error: error.message || "Failed to complete transfer." };
    }
}
