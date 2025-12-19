

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
import { collection, collectionGroup, getDocs, query, where } from 'firebase/firestore';
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
      if (!firestore) return;
      
      setLoading(true);
      try {
        // 1. Fetch all users and create a map for quick lookup.
        const usersQuery = query(collection(firestore, 'users'));
        const usersSnapshot = await getDocs(usersQuery);
        const usersMap = new Map();
        usersSnapshot.forEach(doc => {
            usersMap.set(doc.id, doc.data());
        });

        // 2. Fetch all transactions.
        const transactionsQuery = query(collectionGroup(firestore, 'transactions'), where('status', '==', 'Pending'));
        const transactionsSnapshot = await getDocs(transactionsQuery);
        
        const pendingTransactions: TransactionWithUserDetails[] = [];
        
        transactionsSnapshot.docs.forEach((txDoc) => {
          const data = txDoc.data() as Transaction;
          const userId = txDoc.ref.parent.parent!.id;
          const userData = usersMap.get(userId);

          if (userData) {
            pendingTransactions.push({
              ...data,
              id: txDoc.id,
              userId: userId,
              userEmail:
                userData?.email || `user-${userId.substring(0, 5)}...`,
            });
          }
        });

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
