
'use server';

import { firestore, app } from '@/firebase/server-init';
import { FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { cookies } from 'next/headers';

export async function handleTransactionUpdate(
  transactionPath: string,
  newStatus: 'Completed' | 'Failed'
): Promise<{ success: boolean; error?: string }> {
  try {
    const sessionCookie = cookies().get('session')?.value;
    if (!sessionCookie) {
      throw new Error('Authentication failed. You must be logged in to perform this action.');
    }

    const auth = getAuth(app);
    const decodedClaims = await auth.verifySessionCookie(sessionCookie, true);
    
    if (!decodedClaims) {
      throw new Error('Authentication failed. Could not verify session.');
    }

    const adminUserRecord = await auth.getUser(decodedClaims.uid);
    const adminDoc = await firestore.collection('admins').doc(adminUserRecord.uid).get();

    const isDbAdmin = adminDoc.exists;
    const isSuperAdmin = adminUserRecord.email === 'admin@xavef.com';

    // This is the crucial admin check.
    if (!isDbAdmin && !isSuperAdmin) {
      throw new Error('Permission denied. You must be an authenticated admin to perform this action.');
    }

    const txRef = firestore.doc(transactionPath);
    const userRef = txRef.parent.parent;

    if (!userRef || userRef.parent.id !== 'users') {
      throw new Error('Invalid transaction path.');
    }

    await firestore.runTransaction(async (t) => {
      const txDoc = await t.get(txRef);
      if (!txDoc.exists) {
        throw new Error('Transaction not found.');
      }
      const txData = txDoc.data();
      if (!txData || txData.status !== 'Pending') {
        console.log('Transaction already processed.');
        return;
      }

      t.update(txRef, { status: newStatus });
      
      const userDoc = await t.get(userRef);
      const userName = userDoc.data()?.firstName || 'there';

      const notificationRef = userRef.collection('notifications').doc();
      const notificationTitle = newStatus === 'Completed' ? 'Transaction Approved' : 'Transaction Declined';
      const notificationDesc = `Hi ${userName}, your ${txData.type.toLowerCase()} of ₦${txData.amount.toFixed(2)} has been ${newStatus.toLowerCase()}.`;

      t.set(notificationRef, {
        userId: userRef.id,
        title: notificationTitle,
        description: notificationDesc,
        createdAt: FieldValue.serverTimestamp(),
        read: false,
        actionUrl: '/transactions'
      });

      if (newStatus === 'Completed') {
        if (txData.type === 'Deposit') {
          const balanceField = txData.targetAccount === 'annual' ? 'annualBalance' : 'solidaraBalance';
          t.update(userRef, { [balanceField]: FieldValue.increment(txData.amount) });
        } else if (txData.type === 'Withdrawal') {
          // On withdrawal, the transaction `amount` is the total requested by user.
          // We debit this amount from their balance.
          t.update(userRef, { solidaraBalance: FieldValue.increment(-txData.amount) });
        }
      }
    });

    return { success: true };
  } catch (error: any) {
    console.error('Error in handleTransactionUpdate server action:', error);
    return { success: false, error: error.message || 'An unexpected error occurred.' };
  }
}
