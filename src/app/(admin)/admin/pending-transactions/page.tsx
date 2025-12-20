
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
        const usersQuery = query(collection(firestore, 'users'));
        const usersSnapshot = await getDocs(usersQuery);

        const allPendingTransactions: TransactionWithUserDetails[] = [];

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
        
        // Sort the combined list by date client-side
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

    if (data.errorCode === 'failed-precondition') {
      const regex = /(https:\/\/[^\s]+)/;
      const match = data.error.match(regex);
      const firestoreIndexUrl = match ? match[0] : null;

      return (
        <div className="text-destructive p-4 bg-destructive/10 rounded-md space-y-4">
          <p>
            <b>Action Required:</b> To view pending transactions, a Firestore index must be created. This is a one-time setup.
          </p>
          {firestoreIndexUrl ? (
            <p>
              Please click the link below, then click &quot;Create&quot; in the Firebase Console. The index will take a few minutes to build.
              <br />
              <Link
                href={firestoreIndexUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="underline font-bold"
              >
                Create Firestore Index
              </Link>
            </p>
          ) : (
            <p>Could not extract the index creation URL from the error. Please check the browser console for details.</p>
          )}
        </div>
      );
    }
    
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

