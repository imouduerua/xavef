'use server';

import { firestoreAdmin } from '@/firebase/admin';
import type { Transaction } from '@/lib/types';

type TransactionWithUserDetails = Transaction & {
  userId: string;
  userEmail: string;
};

export async function getPendingTransactionsAction(): Promise<{
  transactions: TransactionWithUserDetails[] | null;
  error?: string;
}> {
  try {
    // In a real app, you MUST verify admin permissions here first.
    // For this demo, we trust the page is protected by AdminAuthGuard.
    const transactionsQuery = firestoreAdmin.collectionGroup('transactions').where('status', '==', 'Pending');
    const querySnapshot = await transactionsQuery.get();
    
    const allTransactions: TransactionWithUserDetails[] = [];

    // This is more efficient than fetching each user doc one-by-one.
    // We get all unique user IDs first.
    const userIds = [...new Set(querySnapshot.docs.map(doc => doc.ref.parent.parent!.id))];
    
    if (userIds.length === 0) {
        return { transactions: [] };
    }

    const userDocs = await firestoreAdmin.getAll(
        ...userIds.map(id => firestoreAdmin.doc(`users/${id}`))
    );

    const usersMap = new Map();
    userDocs.forEach(doc => {
        if (doc.exists) {
            usersMap.set(doc.id, doc.data());
        }
    });

    querySnapshot.docs.forEach((txDoc) => {
      const data = txDoc.data() as Transaction;
      const userId = txDoc.ref.parent.parent!.id;
      const userData = usersMap.get(userId);

      if (userData) {
        allTransactions.push({
          ...data,
          id: txDoc.id,
          userId: userId,
          userEmail:
            userData?.email || `user-${userId.substring(0, 5)}...`,
        });
      }
    });

    return { transactions: allTransactions };

  } catch (error: any) {
    console.error('Error fetching pending transactions:', error);
    // Add a check for permission errors which are common
    if (error.code === 'permission-denied') {
        return {
            transactions: null,
            error: 'Permission denied. Ensure the server has administrative rights to query transactions.',
        };
    }
    return {
      transactions: null,
      error: 'Failed to fetch pending transactions. ' + error.message,
    };
  }
}
