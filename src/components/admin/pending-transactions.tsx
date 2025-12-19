import 'server-only';
import { firestoreAdmin } from '@/firebase/admin';
import type { Transaction } from '@/lib/types';
import { PendingTransactionsTable } from './pending-transactions-table';

type TransactionWithUserDetails = Transaction & { userId: string, userEmail: string };

async function getPendingTransactions(): Promise<TransactionWithUserDetails[]> {
  // Query for all transactions across all users.
  const transactionsQuery = firestoreAdmin.collectionGroup('transactions');
  
  try {
    const querySnapshot = await transactionsQuery.get();
    const allTransactions: TransactionWithUserDetails[] = [];

    // Get all user documents in parallel to reduce latency
    const userPromises = querySnapshot.docs.map(doc => doc.ref.parent.parent!.get());
    const userSnapshots = await Promise.all(userPromises);
    
    querySnapshot.docs.forEach((txDoc, index) => {
      const data = txDoc.data() as Transaction;
      const userDoc = userSnapshots[index];

      // Add user details to each transaction
      if (userDoc.exists) {
        const userData = userDoc.data();
        allTransactions.push({ 
          ...data, 
          id: txDoc.id, 
          userId: userDoc.id, 
          userEmail: userData?.email || `user-${userDoc.id.substring(0,5)}...`
        });
      }
    });
    
    // Filter for pending transactions in code
    const pendingTransactions = allTransactions.filter(tx => tx.status === 'Pending');
    return pendingTransactions;

  } catch (error) {
      console.error("Error fetching transactions:", error);
      // Re-throw or handle as appropriate for your server-side component
      throw new Error("Could not fetch pending transactions.");
  }
}

export async function PendingTransactions() {
  const transactions = await getPendingTransactions();

  if (!transactions) {
    return <p>Could not load transactions.</p>;
  }

  return <PendingTransactionsTable initialTransactions={transactions} />;
}
