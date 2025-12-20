
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { PendingTransactionsTable } from '@/components/admin/pending-transactions-table';
import type { Transaction } from '@/lib/types';
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
  const [data, setData] = useState<{
    transactions: TransactionWithUserDetails[] | null;
    error?: string;
  }>({ transactions: null });
  const [loading, setLoading] = useState(true);
  const firestore = useFirestore();

  useEffect(() => {
    async function getPendingTransactions() {
      if (!firestore) return;

      setLoading(true);
      try {
        const transactionsQuery = query(
          collectionGroup(firestore, 'transactions'),
          where('status', '==', 'Pending'),
          orderBy('date', 'desc')
        );
        const querySnapshot = await getDocs(transactionsQuery);

        const transactions: TransactionWithUserDetails[] = [];
        
        for (const txDoc of querySnapshot.docs) {
            const txData = txDoc.data() as Transaction;
            const userId = txDoc.ref.parent.parent!.id;
            
            const userDocRef = doc(firestore, 'users', userId);
            const userDoc = await getDoc(userDocRef);

            transactions.push({
                ...txData,
                id: txDoc.id,
                userId: userId,
                userEmail: userDoc.exists() ? userDoc.data().email : 'Unknown User',
            });
        }
        setData({ transactions: transactions });

      } catch (error: any) {
        console.error("Error fetching pending transactions:", error);
        let errorMessage = "Could not fetch pending transactions.";
        if (error.code === 'permission-denied') {
          errorMessage = "Permission denied. You must be an admin to view this page.";
        } else if (error.code === 'failed-precondition') {
            errorMessage = `Query requires an index. Please create it in the Firebase console. The error message in your terminal contains the direct link to create the index. Details: ${error.message}`;
        }
        setData({
          transactions: null,
          error: errorMessage,
        });
        toast({
          variant: "destructive",
          title: "Error",
          description: errorMessage,
        });
      } finally {
        setLoading(false);
      }
    }

    getPendingTransactions();
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
          {loading && <Skeleton className="h-40 w-full" />}
          {data.error && <p className="text-destructive p-4 bg-destructive/10 rounded-md">{data.error}</p>}
          {!loading && data.transactions && (
            <PendingTransactionsTable initialTransactions={data.transactions} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
