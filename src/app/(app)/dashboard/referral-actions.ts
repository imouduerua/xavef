
'use server';

import { firestoreAdmin } from '@/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

function generateRandomCode(length = 8) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function generateReferralCode(creatorUid: string): Promise<{
    success: boolean;
    code?: string;
    error?: string;
}> {
    if (!creatorUid) {
        return { success: false, error: 'User is not authenticated.' };
    }

    try {
        const referralCodesRef = firestoreAdmin.collection('referralCodes');
        let newCode: string;
        let isUnique = false;

        // Ensure the generated code is unique
        while (!isUnique) {
            newCode = generateRandomCode();
            const docRef = referralCodesRef.doc(newCode);
            const doc = await docRef.get();
            if (!doc.exists) {
                isUnique = true;
            }
        }

        const referralDocRef = referralCodesRef.doc(newCode!);

        await referralDocRef.set({
            code: newCode!,
            creatorUid: creatorUid,
            used: false,
            createdAt: FieldValue.serverTimestamp(),
        });
        
        return { success: true, code: newCode! };

    } catch (error: any) {
        console.error('Error generating referral code:', error);
        return { success: false, error: 'An unexpected server error occurred.' };
    }
}
