'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { PendingTransactionsTable } from '@/components/admin/pending-transactions-table';
import type { Transaction, UserData } from '@/lib/types';
import React, { useEffect, useState } from 'react';
import { toast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { useFirestore } from '@/firebase';
import { collectionGroup, getDocs, query, where, doc, getDoc, orderBy } from 'firebase/firestore';

type TransactionWithUserDetails = Transaction & {
  userId: string;
  userEmail: string;
};

export default function AdminPendingTransactionsPage() {
  const [transactions, setTransactions] = useState<TransactionWithUserDetails[] | null>(null);
  const [loading, setLoading] = useState(true);
  const firestore = useFirestore();

  useEffect(() => {
    async function getPendingTransactions() {
      if (!firestore) {
          setLoading(true);
          return;
      };

      setLoading(true);
      try {
        const pendingTxsQuery = query(
          collectionGroup(firestore, 'transactions'), 
          where('status', '==', 'Pending'),
          orderBy('date', 'desc')
        );

        const querySnapshot = await getDocs(pendingTxsQuery);
        
        const pendingTransactions = querySnapshot.docs.map(doc => {
            const data = doc.data() as Transaction;
            const pathParts = doc.ref.path.split('/');
            const userId = pathParts[1];
            return {
                ...data,
                id: doc.id,
                userId: userId,
                userEmail: 'Loading...',
            };
        });

        const transactionsWithUserDetails: TransactionWithUserDetails[] = await Promise.all(
          pendingTransactions.map(async (tx) => {
            const userRef = doc(firestore, 'users', tx.userId);
            const userSnap = await getDoc(userRef);
            const userEmail = userSnap.exists() ? (userSnap.data() as UserData).email : 'Unknown User';
            return { ...tx, userEmail };
          })
        );
        
        setTransactions(transactionsWithUserDetails);

      } catch (error: any) {
        console.error("Error fetching pending transactions:", error);
        toast({
            variant: "destructive",
            title: "Error Fetching Data",
            description: "Could not fetch pending transactions.",
        });
        setTransactions([]);
      } finally {
        setLoading(false);
      }
    }

    if (firestore) {
        getPendingTransactions();
    }
  }, [firestore]);
  

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Pending Transactions</CardTitle>
          <CardDescription>
            Review all pending deposits and withdrawals before they are
            processed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-40 w-full" />
          ) : (
             transactions && <PendingTransactionsTable initialTransactions={transactions} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
