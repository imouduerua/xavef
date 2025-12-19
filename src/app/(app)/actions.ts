"use server";

import { getFirestore } from "firebase-admin/firestore";
import { initializeAdminApp } from "@/firebase/admin";

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

    try {
        await initializeAdminApp();
        const firestore = getFirestore();
        
        const code = generateReferralCode();
        const referralCodesRef = firestore.collection('referralCodes');
        
        await referralCodesRef.add({
            code,
            creatorUid: userId,
            used: false,
            createdAt: new Date().toISOString(),
        });

        return { success: true, code };
    } catch (error: any) {
        console.error("Error generating referral code:", error.message);
        return { success: false, error: "Failed to generate referral code. Please try again." };
    }
}
