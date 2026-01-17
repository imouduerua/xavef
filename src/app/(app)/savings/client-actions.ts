
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
  updateDoc,
  getDoc,
} from 'firebase/firestore';

interface SavingGoalData {
  name: string;
  targetAmount: number;
  emoji?: string;
}

export async function createSavingGoal(
  firestore: Firestore,
  userId: string,
  data: SavingGoalData
): Promise<{ success: boolean; error?: string }> {
  if (!firestore) {
    return { success: false, error: 'Database not initialized.' };
  }
  try {
    const goalsCollectionRef = collection(firestore, `users/${userId}/goals`);
    await addDoc(goalsCollectionRef, {
      userId,
      name: data.name,
      targetAmount: data.targetAmount,
      currentAmount: 0,
      emoji: data.emoji || '🎯',
      createdAt: serverTimestamp(),
    });
    return { success: true };
  } catch (error: any) {
    console.error('Error creating saving goal:', error);
    return { success: false, error: 'Failed to create saving goal.' };
  }
}

export async function updateSavingGoal(
  firestore: Firestore,
  userId: string,
  goalId: string,
  data: Partial<SavingGoalData>
): Promise<{ success: boolean; error?: string }> {
    if (!firestore) {
        return { success: false, error: 'Database not initialized.' };
    }
    try {
        const goalDocRef = doc(firestore, `users/${userId}/goals`, goalId);
        await updateDoc(goalDocRef, {
            name: data.name,
            targetAmount: data.targetAmount,
            emoji: data.emoji || '🎯',
        });
        return { success: true };
    } catch (error: any) {
        console.error("Error updating saving goal:", error);
        return { success: false, error: "Failed to update saving goal." };
    }
}


export async function deleteSavingGoal(
  firestore: Firestore,
  userId: string,
  goalId: string
): Promise<{ success: boolean; error?: string }> {
  if (!firestore) {
    return { success: false, error: 'Database not initialized.' };
  }
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
  if (!firestore) {
    return { success: false, error: 'Database not initialized.' };
  }
  const userDocRef = doc(firestore, 'users', userId);
  const goalDocRef = doc(firestore, `users/${userId}/goals`, goalId);
  const transactionCollectionRef = collection(firestore, `users/${userId}/transactions`);

  try {
    await runTransaction(firestore, async (transaction) => {
      const userDoc = await transaction.get(userDocRef);
      const goalDoc = await transaction.get(goalDocRef);

      if (!userDoc.exists()) {
        throw new Error('User data not found.');
      }
      if (!goalDoc.exists()) {
        throw new Error('Saving goal not found.');
      }

      const userData = userDoc.data();
      const goalData = goalDoc.data();

      if (userData.solidaraBalance < amount) {
        throw new Error('Insufficient Olidara balance.');
      }

      // Perform the updates
      transaction.update(userDocRef, { solidaraBalance: increment(-amount) });
      transaction.update(goalDocRef, { currentAmount: increment(amount) });
      
      // Create a transaction record for this internal transfer
      const newTxDocRef = doc(transactionCollectionRef);
      transaction.set(newTxDocRef, {
        amount: -amount,
        date: serverTimestamp(),
        description: `Transfer to goal: "${goalData.name}"`,
        type: 'Internal Transfer',
        status: 'Completed',
        targetAccount: 'solidara',
        userEmail: userData.email,
      });

    });
    return { success: true };
  } catch (error: any) {
    console.error('Error adding funds to goal:', error);
    return {
      success: false,
      error: error.message || 'An unexpected error occurred.',
    };
  }
}

export async function withdrawFromGoal(
  firestore: Firestore,
  userId: string,
  goalId: string,
  amount: number
): Promise<{ success: boolean; error?: string }> {
  if (!firestore) {
    return { success: false, error: 'Database not initialized.' };
  }
  if (amount <= 0) {
    return { success: false, error: 'Withdrawal amount must be positive.' };
  }

  const userDocRef = doc(firestore, 'users', userId);
  const goalDocRef = doc(firestore, `users/${userId}/goals`, goalId);
  const transactionCollectionRef = collection(firestore, `users/${userId}/transactions`);

  try {
    await runTransaction(firestore, async (transaction) => {
      const userDoc = await transaction.get(userDocRef);
      const goalDoc = await transaction.get(goalDocRef);

      if (!userDoc.exists()) {
        throw new Error('User data not found.');
      }
      if (!goalDoc.exists()) {
        throw new Error('Saving goal not found.');
      }

      const userData = userDoc.data();
      const goalData = goalDoc.data();

      if (goalData.currentAmount < amount) {
        throw new Error('Insufficient funds in goal.');
      }

      // Perform the updates
      transaction.update(goalDocRef, { currentAmount: increment(-amount) });
      transaction.update(userDocRef, { solidaraBalance: increment(amount) });
      
      // Create a transaction record for this internal transfer
      const newTxDocRef = doc(transactionCollectionRef);
      transaction.set(newTxDocRef, {
        amount: amount, // Credit to Solidara, so positive
        date: serverTimestamp(),
        description: `Transfer from goal: "${goalData.name}"`,
        type: 'Internal Transfer',
        status: 'Completed',
        targetAccount: 'solidara',
        userEmail: userData.email,
      });
    });
    return { success: true };
  } catch (error: any) {
    console.error('Error withdrawing funds from goal:', error);
    return {
      success: false,
      error: error.message || 'An unexpected error occurred.',
    };
  }
}


export async function withdrawCompletedGoal(
  firestore: Firestore,
  userId: string,
  goalId: string
): Promise<{ success: boolean; error?: string }> {
  if (!firestore) {
    return { success: false, error: 'Database not initialized.' };
  }
  const userDocRef = doc(firestore, 'users', userId);
  const goalDocRef = doc(firestore, `users/${userId}/goals`, goalId);

  try {
    await runTransaction(firestore, async (transaction) => {
      const goalDoc = await transaction.get(goalDocRef);
      if (!goalDoc.exists()) {
        throw new Error('Saving goal not found.');
      }

      const goalData = goalDoc.data();
      const amountToWithdraw = goalData.currentAmount;

      if (amountToWithdraw <= 0) {
        throw new Error('Nothing to withdraw.');
      }
      
      // Add funds back to Olidara balance
      transaction.update(userDocRef, { solidaraBalance: increment(amountToWithdraw) });
      // Reset the goal's current amount to 0 instead of deleting it.
      transaction.update(goalDocRef, { currentAmount: 0 });
    });

    return { success: true };
  } catch (error: any) {
    console.error('Error withdrawing completed goal:', error);
    return { success: false, error: error.message || 'Could not withdraw goal funds.' };
  }
}
