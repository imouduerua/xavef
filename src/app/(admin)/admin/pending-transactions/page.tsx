
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
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';

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
        // 1. Get all users
        const usersQuery = query(collection(firestore, 'users'));
        const usersSnapshot = await getDocs(usersQuery);

        const allPendingTransactions: TransactionWithUserDetails[] = [];

        // 2. For each user, get their pending transactions
        for (const userDoc of usersSnapshot.docs) {
          const userData = userDoc.data() as UserData;
          const userId = userDoc.id;

          const transactionsQuery = query(
            collection(firestore, `users/${userId}/transactions`),
            where('status', '==', 'Pending')
          );
          
          const transactionsSnapshot = await getDocs(transactionsQuery);

          transactionsSnapshot.forEach((txDoc) => {
            allPendingTransactions.push({
              ...(txDoc.data() as Transaction),
              id: txDoc.id,
              userId: userId,
              userEmail: userData.email || 'Unknown User',
            });
          });
        }
        
        // 3. Sort the combined list by date
        const sortedTransactions = allPendingTransactions.sort((a, b) => {
            const dateA = a.date ? new Date(a.date).getTime() : 0;
            const dateB = b.date ? new Date(b.date).getTime() : 0;
            return dateB - dateA;
        });

        setData({ transactions: sortedTransactions });

      } catch (error: any) {
        console.error("Error fetching pending transactions:", error);
        let errorMessage = "Could not fetch pending transactions.";
        if (error.code === 'permission-denied') {
          errorMessage = "Permission denied. You must be an admin to view this page.";
        } else if (error.code === 'failed-precondition' && error.message.includes('index')) {
            const urlRegex = /(https?:\/\/[^\s]+)/;
            const match = error.message.match(urlRegex);
            const indexUrl = match ? match[0] : null;

            errorMessage = `Query requires a Firestore index. Please create it in the Firebase console.`;
            
            if (indexUrl) {
                errorMessage += ` You can click this link to create it automatically: <a href="${indexUrl}" target="_blank" rel="noopener noreferrer" class="underline font-semibold">${indexUrl}</a>. After the index is built (a few minutes), please refresh this page.`;
            }
        }
        setData({
          transactions: null,
          error: errorMessage,
        });
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch data. Check the error message on the page.",
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
          {data.error && (
            <div 
              className="text-destructive p-4 bg-destructive/10 rounded-md"
              dangerouslySetInnerHTML={{ __html: data.error }}
            />
          )}
          {!loading && data.transactions && (
            <PendingTransactionsTable initialTransactions={data.transactions} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
