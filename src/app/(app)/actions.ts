"use server";

import { initializeApp, getApps, getApp, deleteApp } from "firebase/app";
import { getFirestore, collection, addDoc } from "firebase/firestore";
import { firebaseConfig } from "@/firebase/config";

function getFirebaseApp() {
    // A server action can be invoked multiple times, so we need a stable way
    // to get the initialized app.
    if (getApps().length > 0) {
        return getApp();
    }
    return initializeApp(firebaseConfig, `firebase-server-action-${Date.now()}`);
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

    let app;
    try {
        app = getFirebaseApp();
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
    } finally {
        if(app) {
            // Clean up the app instance to avoid issues on subsequent calls in a hot-reload environment
            // This is not strictly necessary in production but good practice in dev
            // await deleteApp(app);
        }
    }
}
