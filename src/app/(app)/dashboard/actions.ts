

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
    setDoc,
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
}

export async function createUserProfile(
  firestore: Firestore,
  user: AuthUser,
  data: CreateProfileData
): Promise<{ success: boolean; error?: string }> {
  const userDocRef = doc(firestore, 'users', user.uid);

  try {
    const xavefId = await generateUniqueXavefId(firestore);

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
      referredBy: null,
      solidaraBalance: 0,
      annualBalance: 0,
      bankAccounts: [],
    };
    
    // Create the user profile in a single operation.
    await setDoc(userDocRef, newUserProfile);

    // Create default saving goals in a separate batch, which is more robust.
    const goalsCollectionRef = collection(firestore, `users/${user.uid}/goals`);
    const defaultGoals = [
      { name: 'House Rent', targetAmount: 0, emoji: '🏠' },
      { name: 'School Fees', targetAmount: 0, emoji: '🎓' },
    ];
    
    const goalsBatch = writeBatch(firestore);
    for (const goal of defaultGoals) {
      const newGoalRef = doc(goalsCollectionRef);
      goalsBatch.set(newGoalRef, {
        userId: user.uid,
        name: goal.name,
        targetAmount: goal.targetAmount,
        currentAmount: 0,
        createdAt: serverTimestamp(),
        emoji: goal.emoji,
      });
    }
    // This can happen in the background and doesn't need to block registration success.
    await goalsBatch.commit();


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
