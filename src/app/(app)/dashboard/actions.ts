
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
    DocumentReference,
} from "firebase/firestore";
import type { User as AuthUser } from "firebase/auth";
import type { ReferralCode, UserData, BankAccount } from "@/lib/types";
import { v4 as uuidv4 } from 'uuid';

function generateUniqueXavefId(): string {
    // Generate a UUID and take the first 6 characters for a shorter, unique-enough ID.
    // The chance of collision is astronomically low for a small to medium user base.
    return uuidv4().substring(0, 6).toUpperCase();
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
  let referredBy: string | null = null;
  let referralCodeRef: DocumentReference | null = null;

  try {
    // Perform all read operations BEFORE the transaction
    if (data.referralCode) {
      const codeQuery = query(
        collection(firestore, 'referralCodes'),
        where('code', '==', data.referralCode.trim().toUpperCase()),
        limit(1)
      );
      const codeSnap = await getDocs(codeQuery);

      if (codeSnap.empty) {
        throw new Error('Invalid referral code.');
      }
      
      const codeDoc = codeSnap.docs[0];
      const codeData = codeDoc.data() as ReferralCode;

      if (codeData.used) {
        throw new Error('This referral code has already been used.');
      }
      
      referredBy = codeData.creatorUid;
      referralCodeRef = codeDoc.ref;
    }

    // Generate the unique ID once, outside the transaction.
    const xavefId = generateUniqueXavefId();

    // Now, perform all write operations within the transaction
    await runTransaction(firestore, async (transaction) => {
      
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

      // 1. Create the new user profile
      transaction.set(userDocRef, newUserProfile);

      // 2. If a referral code was used, mark it as used
      if (referralCodeRef) {
        transaction.update(referralCodeRef, { used: true });
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
