
'use client';

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  serverTimestamp,
  Firestore,
  runTransaction,
  increment,
} from 'firebase/firestore';

interface SavingGoalData {
  name: string;
  targetAmount: number;
  targetDate?: Date;
  emoji?: string;
}

export async function createSavingGoal(
  firestore: Firestore,
  userId: string,
  data: SavingGoalData
): Promise<{ success: boolean; error?: string }> {
  try {
    const goalsCollectionRef = collection(firestore, `users/${userId}/goals`);
    await addDoc(goalsCollectionRef, {
      userId,
      name: data.name,
      targetAmount: data.targetAmount,
      currentAmount: 0,
      targetDate: data.targetDate || null,
      emoji: data.emoji || '🎯',
      createdAt: serverTimestamp(),
    });
    return { success: true };
  } catch (error: any) {
    console.error('Error creating saving goal:', error);
    return { success: false, error: 'Failed to create saving goal.' };
  }
}

export async function deleteSavingGoal(
  firestore: Firestore,
  userId: string,
  goalId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const goalDocRef = doc(firestore, `users/${userId}/goals`, goalId);
    await deleteDoc(goalDocRef);
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting saving goal:', error);
    return { success: false, error: 'Failed to delete saving goal.' };
  }
}


export async function addFundsToGoal(
  firestore: Firestore,
  userId: string,
  goalId: string,
  amount: number
): Promise<{ success: boolean; error?: string }> {
    const userDocRef = doc(firestore, 'users', userId);
    const goalDocRef = doc(firestore, `users/${userId}/goals`, goalId);

    try {
        await runTransaction(firestore, async (transaction) => {
            const userDoc = await transaction.get(userDocRef);
            const goalDoc = await transaction.get(goalDocRef);

            if (!userDoc.exists()) {
                throw new Error("User data not found.");
            }
            if (!goalDoc.exists()) {
                throw new Error("Saving goal not found.");
            }

            const userData = userDoc.data();
            if (userData.solidaraBalance < amount) {
                throw new Error("Insufficient Solidara balance.");
            }

            // Perform the updates
            transaction.update(userDocRef, { solidaraBalance: increment(-amount) });
            transaction.update(goalDocRef, { currentAmount: increment(amount) });
        });
        return { success: true };
    } catch (error: any) {
        console.error("Error adding funds to goal:", error);
        return { success: false, error: error.message || "An unexpected error occurred." };
    }
}
