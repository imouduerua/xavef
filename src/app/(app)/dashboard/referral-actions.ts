
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
        let attempts = 0;

        // Ensure the generated code is unique, with a limit on attempts
        while (!isUnique && attempts < 10) {
            newCode = generateRandomCode();
            const docRef = referralCodesRef.doc(newCode);
            const doc = await docRef.get();
            if (!doc.exists) {
                isUnique = true;
            }
            attempts++;
        }

        if (!isUnique) {
            throw new Error('Could not generate a unique referral code. Please try again.');
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
        return { success: false, error: error.message || 'An unexpected server error occurred.' };
    }
}
