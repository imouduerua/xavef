'use client';

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  serverTimestamp,
  Firestore,
} from 'firebase/firestore';

interface SavingGoalData {
  name: string;
  targetAmount: number;
  targetDate?: Date;
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
