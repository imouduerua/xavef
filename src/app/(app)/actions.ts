"use server";

import { useAuth, useFirestore } from "@/firebase";
import { addDoc, collection } from "firebase/firestore";
import { headers } from "next/headers";
import { getAuth } from "firebase/auth";
import { initializeFirebase } from "@/firebase";

function generateReferralCode(length = 8) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

export async function createReferralCode(): Promise<{ success: boolean; code?: string; error?: string; }> {
    const { auth, firestore } = initializeFirebase();
    const currentUser = auth.currentUser;

    if (!currentUser) {
        return { success: false, error: "You must be logged in to generate a code." };
    }

    try {
        const code = generateReferralCode();
        const referralCodesRef = collection(firestore, 'referralCodes');
        
        await addDoc(referralCodesRef, {
            code,
            creatorUid: currentUser.uid,
            used: false,
            createdAt: new Date().toISOString(),
        });

        return { success: true, code };
    } catch (error) {
        console.error("Error generating referral code:", error);
        return { success: false, error: "Failed to generate referral code. Please try again." };
    }
}
