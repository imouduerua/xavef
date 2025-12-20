
'use server';

import { z } from 'zod';
import { addDoc, collection, doc, serverTimestamp, updateDoc, deleteDoc } from 'firebase/firestore';
import { firestore } from '@/firebase/server-init';
import { revalidatePath } from 'next/cache';
import { auth } from 'firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { authAdmin } from '@/firebase/admin';

const goalSchema = z.object({
  name: z.string().min(1, 'Goal name is required.'),
  targetAmount: z.coerce.number().positive('Target amount must be positive.'),
  targetDate: z.date().optional(),
});

export async function createSavingGoal(
    userId: string,
    values: z.infer<typeof goalSchema>
): Promise<{ success: boolean; error?: string }> {
  if (!userId) {
    return { success: false, error: 'User is not authenticated.' };
  }

  const validation = goalSchema.safeParse(values);
  if (!validation.success) {
    return { success: false, error: 'Invalid input.' };
  }

  try {
    const goalsCollectionRef = collection(firestore, `users/${userId}/goals`);
    await addDoc(goalsCollectionRef, {
      userId,
      name: validation.data.name,
      targetAmount: validation.data.targetAmount,
      currentAmount: 0,
      targetDate: validation.data.targetDate || null,
      createdAt: serverTimestamp(),
    });

    revalidatePath('/savings');
    return { success: true };
  } catch (error: any) {
    console.error('Error creating saving goal:', error);
    return { success: false, error: 'Failed to create saving goal.' };
  }
}

export async function deleteSavingGoal(
  userId: string,
  goalId: string
): Promise<{ success: boolean; error?: string }> {
    if (!userId) {
        return { success: false, error: 'User is not authenticated.' };
    }

    if (!goalId) {
        return { success: false, error: 'Goal ID is missing.' };
    }

    try {
        const goalDocRef = doc(firestore, `users/${userId}/goals`, goalId);
        await deleteDoc(goalDocRef);

        revalidatePath('/savings');
        return { success: true };
    } catch (error: any) {
        console.error('Error deleting saving goal:', error);
        return { success: false, error: 'Failed to delete saving goal.' };
    }
}
