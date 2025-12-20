
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
import { collectionGroup, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import Link from 'next/link';

type TransactionWithUserDetails = Transaction & {
  userId: string;
  userEmail: string;
};

export default function AdminPendingTransactionsPage() {
  const [data, setData] = useState<{
    transactions: TransactionWithUserDetails[] | null;
    error?: string;
    errorCode?: string
  }>({ transactions: null });
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
        // Use a collection group query to fetch all pending transactions across all users.
        const pendingTxsQuery = query(
          collectionGroup(firestore, 'transactions'), 
          where('status', '==', 'Pending')
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
                userEmail: 'Loading...', // We'll fetch this next
            };
        });

        // Now, fetch the user details for each transaction
        let transactionsWithUserDetails: TransactionWithUserDetails[] = await Promise.all(
          pendingTransactions.map(async (tx) => {
            const userRef = doc(firestore, 'users', tx.userId);
            const userSnap = await getDoc(userRef);
            const userEmail = userSnap.exists() ? (userSnap.data() as UserData).email : 'Unknown User';
            return { ...tx, userEmail };
          })
        );
        
        // Sort transactions by date client-side
        transactionsWithUserDetails.sort((a, b) => {
            const dateA = a.date ? new Date(a.date).getTime() : 0;
            const dateB = b.date ? new Date(b.date).getTime() : 0;
            return dateB - dateA;
        });

        setData({ transactions: transactionsWithUserDetails });

      } catch (error: any) {
        console.error("Error fetching pending transactions:", error);
        let errorMessage = "Could not fetch pending transactions.";

        // Handle the specific error for a missing index
        if (error.code === 'failed-precondition' && error.message.includes('index')) {
          errorMessage = "A database index is required for this query. Please check the Firestore documentation to create the necessary composite index for the 'transactions' collection group.";
        } else if (error.code === 'permission-denied') {
          errorMessage = "Permission denied. You must be an admin to view this page.";
        }
        
        setData({
          transactions: null,
          error: errorMessage,
          errorCode: error.code,
        });
        
        toast({
            variant: "destructive",
            title: "Error Fetching Data",
            description: errorMessage,
        });

      } finally {
        setLoading(false);
      }
    }

    if (firestore) {
        getPendingTransactions();
    }
  }, [firestore]);
  

  const renderErrorContent = () => {
    if (!data.error) return null;
    
    return (
        <div className="text-destructive p-4 bg-destructive/10 rounded-md">
            {data.error}
        </div>
    );
  };

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
          {data.error && renderErrorContent()}
          {!loading && !data.error && data.transactions && (
            <PendingTransactionsTable initialTransactions={data.transactions} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
