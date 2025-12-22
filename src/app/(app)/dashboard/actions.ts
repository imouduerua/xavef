
'use server';

import { 
    getFirestore,
    collection,
    query,
    where,
    getDocs,
    runTransaction,
    doc,
    serverTimestamp,
    increment
} from 'firebase-admin/firestore';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import type { UserData } from '@/lib/types';


// Initialize Firebase Admin SDK if not already initialized
if (!getApps().length) {
    initializeApp({
        // The service account is automatically available in the App Hosting environment
    });
}

const db = getFirestore();

export async function makeTransfer(data: {
  senderUid: string;
  recipientXavefId: string;
  amount: number;
}): Promise<{ success: boolean; error?: string }> {
  
    const { senderUid, recipientXavefId, amount } = data;

    if (amount <= 0) {
        return { success: false, error: 'Transfer amount must be positive.' };
    }

    try {
        // Find recipient by xavefId
        const usersRef = collection(db, 'users');
        const recipientQuery = query(usersRef, where('xavefId', '==', recipientXavefId), where('uid', '!=', senderUid));
        const recipientSnapshot = await getDocs(recipientQuery);

        if (recipientSnapshot.empty) {
            return { success: false, error: 'Recipient with that Xavef ID not found.' };
        }

        const recipient = recipientSnapshot.docs[0].data() as UserData;
        const recipientUid = recipient.uid;
        
        if (!recipientUid) {
            return { success: false, error: 'Recipient UID not found.' };
        }
        
        const senderRef = doc(db, 'users', senderUid);
        const recipientRef = doc(db, 'users', recipientUid);
        

        // Run as a transaction to ensure atomicity
        await runTransaction(db, async (transaction) => {
            const senderDoc = await transaction.get(senderRef);
            if (!senderDoc.exists()) {
                throw new Error('Sender not found.');
            }

            const senderData = senderDoc.data() as UserData;
            if (senderData.solidaraBalance < amount) {
                throw new Error('Insufficient funds.');
            }
            
            // 1. Debit the sender
            transaction.update(senderRef, { solidaraBalance: increment(-amount) });

            // 2. Credit the recipient
            transaction.update(recipientRef, { solidaraBalance: increment(amount) });
            
            const timestamp = serverTimestamp();

            // 3. Create sender's transaction record
            const senderTxRef = doc(collection(senderRef, 'transactions'));
            transaction.set(senderTxRef, {
                amount: -amount,
                date: timestamp,
                description: `Transfer to ${recipient.displayName || 'user'} (${recipientXavefId})`,
                type: 'User Transfer',
                status: 'Completed',
                targetAccount: 'solidara'
            });

            // 4. Create recipient's transaction record
            const recipientTxRef = doc(collection(recipientRef, 'transactions'));
            transaction.set(recipientTxRef, {
                amount: amount,
                date: timestamp,
                description: `Transfer from ${senderData.displayName || 'user'}`,
                type: 'User Transfer',
                status: 'Completed',
                targetAccount: 'solidara'
            });

            // 5. (Optional but good practice) Create a root-level transfer record
            const transferRecordRef = doc(collection(db, 'transfers'));
            transaction.set(transferRecordRef, {
                senderUid,
                recipientUid,
                amount,
                createdAt: timestamp,
                status: 'completed'
            });
        });

        return { success: true };

    } catch (error: any) {
        console.error('Error during user transfer:', error);
        return { success: false, error: error.message || 'An unexpected error occurred during the transfer.' };
    }
}

    