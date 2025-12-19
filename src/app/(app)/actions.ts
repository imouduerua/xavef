"use server";

import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, collection, addDoc } from "firebase/firestore";
import { firebaseConfig } from "@/firebase/config";

function getFirebaseApp() {
    if (getApps().length > 0) {
        return getApp();
    }
    return initializeApp(firebaseConfig);
}

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
        const app = getFirebaseApp();
        const firestore = getFirestore(app);

        const code = generateReferralCode();
        const referralCodesRef = collection(firestore, 'referralCodes');
        
        await addDoc(referralCodesRef, {
            code,
            creatorUid: userId,
            used: false,
            createdAt: new Date().toISOString(),
        });

        return { success: true, code };
    } catch (error: any) {
        console.error("Error generating referral code:", error);
        return { success: false, error: "Failed to generate referral code. Please try again." };
    }
}
