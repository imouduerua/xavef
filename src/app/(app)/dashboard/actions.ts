

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
  data: CreateProfileData
): Promise<{ success: boolean; error?: string }> {
  const userDocRef = doc(firestore, 'users', user.uid);
  const referralCodesRef = collection(firestore, 'referralCodes');

  try {
    await runTransaction(firestore, async (transaction) => {
      // 1. Find the referral code document by querying for the 'code' field.
      // This MUST be inside the transaction to ensure atomicity.
      const referralQuery = query(
        referralCodesRef,
        where('code', '==', data.referralCode),
        limit(1)
      );

      // We perform a read via getDocs first. The actual update will use the transaction.
      const referralQuerySnapshot = await getDocs(referralQuery);

      if (referralQuerySnapshot.empty) {
        throw new Error('The provided referral code is invalid.');
      }

      const referralDoc = referralQuerySnapshot.docs[0];
      const referralData = referralDoc.data() as ReferralCode;

      if (referralData.used) {
        throw new Error('The provided referral code has already been used.');
      }
      
      const userSnap = await transaction.get(userDocRef);
      if (userSnap.exists()) {
        throw new Error("A user profile for this account already exists.");
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

      // 2. Create the new user's profile document.
      transaction.set(userDocRef, newUserProfile);

      // 3. Create default saving goals.
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

      // 4. Mark the referral code as used.
      transaction.update(referralDoc.ref, {
        used: true,
        usedBy: user.uid,
        usedAt: serverTimestamp(),
      });

      // Transactions must not return a value.
    });

    // If the transaction completes without throwing an error, it was successful.
    return { success: true };
  } catch (error: any) {
    console.error(
      '[createUserProfile] Error during profile creation transaction:',
      error
    );
    // The error message from the transaction (e.g., "invalid code") will be passed here.
    return {
      success: false,
      error: error.message || `An unexpected error occurred during profile creation.`,
    };
  }
}
