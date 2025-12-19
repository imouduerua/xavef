import 'server-only';
import { firestoreAdmin } from '@/firebase/admin';
import type { Transaction } from '@/lib/types';
import { PendingTransactionsTable } from './pending-transactions-table';

type TransactionWithUserDetails = Transaction & { userId: string, userEmail: string };

async function getPendingTransactions() {
  const transactionsQuery = firestoreAdmin.collectionGroup('transactions').where('status', '==', 'Pending');
  
  try {
    const querySnapshot = await transactionsQuery.get();
    const transactionsData: TransactionWithUserDetails[] = [];

    const userPromises = querySnapshot.docs.map(doc => doc.ref.parent.parent!.get());
    const userSnapshots = await Promise.all(userPromises);
    
    querySnapshot.docs.forEach((txDoc, index) => {
      const data = txDoc.data() as Transaction;
      const userDoc = userSnapshots[index];

      if (userDoc.exists) {
        const userData = userDoc.data();
        transactionsData.push({ 
          ...data, 
          id: txDoc.id, 
          userId: userDoc.id, 
          userEmail: userData?.email || `user-${userDoc.id.substring(0,5)}...`
        });
      }
    });
    
    return transactionsData;
  } catch (error) {
      console.error("Error fetching transactions:", error);
      // Re-throw or handle as appropriate for your server-side component
      throw new Error("Could not fetch pending transactions.");
  }
}

export async function PendingTransactions() {
  const transactions = await getPendingTransactions();

  if (!transactions || transactions.length === 0) {
    return <p>No pending transactions found.</p>;
  }

  return <PendingTransactionsTable initialTransactions={transactions} />;
}
