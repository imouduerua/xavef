
'use client';

import { doc, runTransaction, increment, serverTimestamp, collection } from "firebase/firestore";
import type { Firestore } from "firebase/firestore";

export async function transferToAnnual(
    firestore: Firestore,
    userId: string,
    amount: number
): Promise<{ success: boolean; error?: string }> {
    if (!firestore) {
        return { success: false, error: "Database not initialized." };
    }
    if (amount <= 0) {
        return { success: false, error: "Transfer amount must be positive." };
    }

    const userRef = doc(firestore, 'users', userId);
    const transactionRef = collection(firestore, 'users', userId, 'transactions');

    try {
        await runTransaction(firestore, async (transaction) => {
            const userDoc = await transaction.get(userRef);
            if (!userDoc.exists()) {
                throw new Error("User data not found.");
            }

            const userData = userDoc.data();
            if (userData.olidaraBalance < amount) {
                throw new Error("Insufficient Olidara balance for this transfer.");
            }

            // Debit from Olidara, credit to Annual
            transaction.update(userRef, {
                olidaraBalance: increment(-amount),
                annualBalance: increment(amount),
            });

            // Create a transaction record for this internal transfer
            const newTxDocRef = doc(transactionRef);
            transaction.set(newTxDocRef, {
                amount: -amount,
                date: serverTimestamp(),
                description: "Transfer to Annual Savings",
                type: "Internal Transfer",
                status: "Completed",
                targetAccount: "olidara",
                userEmail: userData.email,
            });
        });
        return { success: true };
    } catch (error: any) {
        console.error("Error transferring to annual savings:", error);
        return { success: false, error: error.message || "An unexpected error occurred." };
    }
}
