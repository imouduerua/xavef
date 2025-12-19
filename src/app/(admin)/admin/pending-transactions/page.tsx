
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { PendingTransactionsTable } from '@/components/admin/pending-transactions-table';
import { useFirestore } from '@/firebase';
import type { Transaction } from '@/lib/types';
import { collectionGroup, getDocs, query } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { toast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

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
      try {
        const transactionsQuery = query(collectionGroup(firestore, 'transactions'));
        const querySnapshot = await getDocs(transactionsQuery);
        const allTransactions: TransactionWithUserDetails[] = [];

        const userPromises = querySnapshot.docs.map((doc) =>
          getDocs(collectionGroup(firestore, 'users')).then(userCollection => {
            const userDoc = userCollection.docs.find(u => u.id === doc.ref.parent.parent!.id);
            return userDoc;
          })
        );
        
        const userSnapshots = await Promise.all(
          querySnapshot.docs.map(doc => getDocs(query(collectionGroup(firestore, 'users'), where('uid', '==', doc.ref.parent.parent!.id))))
        );

        const usersMap = new Map();
        const allUserDocsQuery = query(collectionGroup(firestore, 'users'));
        const allUserDocsSnapshot = await getDocs(allUserDocsQuery);
        allUserDocsSnapshot.forEach(doc => usersMap.set(doc.id, doc.data()));

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
        
        const pendingTransactions = allTransactions.filter(
          (tx) => tx.status === 'Pending'
        );

        setData({ transactions: pendingTransactions });
      } catch (error: any) {
        console.error('Error fetching pending transactions:', error);
        setData({
          transactions: null,
          error: 'Failed to fetch pending transactions. ' + error.message,
        });
        toast({
            variant: "destructive",
            title: "Error",
            description: "Could not fetch pending transactions. You may not have the required permissions."
        })
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
          {data.error && <p className="text-destructive">{data.error}</p>}
          {!loading && data.transactions && (
            <PendingTransactionsTable initialTransactions={data.transactions} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
