
'use server';

import { firestore } from '@/firebase/server-init';
import { FieldValue } from 'firebase-admin/firestore';

// This server action uses the Admin SDK to securely update transactions.
// It contains the full logic for approving/declining transactions and notifying users.

export async function handleTransactionUpdate(
  transactionPath: string,
  newStatus: 'Completed' | 'Failed'
): Promise<{ success: boolean; error?: string }> {
  try {
    const { getAuthenticatedUser } = await import('@/firebase/server-auth');
    const adminUser = await getAuthenticatedUser();
    
    if (!adminUser) {
        throw new Error('Authentication failed. You must be an authenticated admin to perform this action.');
    }
    
    // Correctly check for admin privileges
    const adminDoc = await firestore.collection('admins').doc(adminUser.uid).get();
    const isAdminInDB = adminDoc.exists;
    const isSuperAdminEmail = adminUser.email === 'admin@xavef.com';
    
    if (!isAdminInDB && !isSuperAdminEmail) {
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
        // Idempotency check: If transaction is already processed, do nothing.
        console.log('Transaction already processed.');
        return;
      }

      t.update(txRef, { status: newStatus });
      
      const userDoc = await t.get(userRef);
      const userName = userDoc.data()?.firstName || 'there';

      // Create notification for the user
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

      // If the transaction is approved, update the user's balance.
      if (newStatus === 'Completed') {
        if (txData.type === 'Deposit') {
          const balanceField = txData.targetAccount === 'annual' ? 'annualBalance' : 'solidaraBalance';
          t.update(userRef, { [balanceField]: FieldValue.increment(txData.amount) });
        } else if (txData.type === 'Withdrawal') {
          // On withdrawal, the transaction amount is positive. We need to debit the account.
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
