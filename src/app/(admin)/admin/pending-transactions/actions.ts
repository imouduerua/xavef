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
    const transactionsQuery = firestoreAdmin.collectionGroup('transactions');
    const querySnapshot = await transactionsQuery.get();
    const allTransactions: TransactionWithUserDetails[] = [];

    const userPromises = querySnapshot.docs.map((doc) =>
      doc.ref.parent.parent!.get()
    );
    const userSnapshots = await Promise.all(userPromises);

    querySnapshot.docs.forEach((txDoc, index) => {
      const data = txDoc.data() as Transaction;
      const userDoc = userSnapshots[index];

      if (userDoc.exists) {
        const userData = userDoc.data();
        allTransactions.push({
          ...data,
          id: txDoc.id,
          userId: userDoc.id,
          userEmail:
            userData?.email || `user-${userDoc.id.substring(0, 5)}...`,
        });
      }
    });

    const pendingTransactions = allTransactions.filter(
      (tx) => tx.status === 'Pending'
    );

    return { transactions: pendingTransactions };
  } catch (error: any) {
    console.error('Error fetching pending transactions:', error);
    return {
      transactions: null,
      error: 'Failed to fetch pending transactions. ' + error.message,
    };
  }
}
