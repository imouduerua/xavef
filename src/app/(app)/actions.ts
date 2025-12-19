"use server";

import { addDoc, collection } from "firebase/firestore";
import { initializeFirebase } from "@/firebase";

function generateReferralCode(length = 8) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

export async function createReferralCode(userId: string): Promise<{ success: boolean; code?: string; error?: string; }> {
    if (!userId) {
        return { success: false, error: "You must be logged in to generate a code." };
    }

    const { firestore } = initializeFirebase();

    try {
        const code = generateReferralCode();
        const referralCodesRef = collection(firestore, 'referralCodes');
        
        const docRef = await addDoc(referralCodesRef, {
            code,
            creatorUid: userId,
            used: false,
            createdAt: new Date().toISOString(),
        });

        return { success: true, code };
    } catch (error) {
        return { success: false, error: "Failed to generate referral code. Please try again." };
    }
}
