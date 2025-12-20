
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
import { useCollection, useFirestore } from '@/firebase';
import { collectionGroup, getDocs, query, where, doc, getDoc, orderBy } from 'firebase/firestore';
import { MissingIndexAlert } from '@/components/admin/missing-index-alert';


type TransactionWithUserDetails = Transaction & {
  userId: string;
  userEmail: string;
  xavefId: string;
};

export default function AdminPendingTransactionsPage() {
  const [transactions, setTransactions] = useState<TransactionWithUserDetails[] | null>(null);
  const [loading, setLoading] = useState(true);
  const firestore = useFirestore();

  const pendingTxsQuery = React.useMemo(() => {
    if (!firestore) return null;
    return query(
        collectionGroup(firestore, 'transactions'), 
        where('status', '==', 'Pending'),
        orderBy('date', 'desc')
    );
  }, [firestore]);

  const { data: rawTransactions, loading: rawLoading, indexCreationUrl } = useCollection<Transaction>(pendingTxsQuery);

  useEffect(() => {
    async function attachUserDetails() {
      if (rawLoading) {
        setLoading(true);
        return;
      }
      if (!rawTransactions || !firestore) {
        setTransactions(null);
        setLoading(false);
        return;
      }
      
      setLoading(true);
      try {
        const transactionsWithUserDetails: TransactionWithUserDetails[] = await Promise.all(
          rawTransactions.map(async (tx) => {
            // The userId is now guaranteed by the useCollection hook
            const userId = tx.userId!;

            const userRef = doc(firestore, 'users', userId);
            const userSnap = await getDoc(userRef);
            const userEmail = userSnap.exists() ? (userSnap.data() as UserData).email : 'Unknown User';
            const xavefId = userSnap.exists() ? (userSnap.data() as UserData).xavefId : 'N/A';

            // IMPORTANT: Return the entire original transaction object 'tx',
            // then layer the user details on top. This preserves all fields
            // from the original transaction, including `payoutAmount`.
            return {
                ...tx,
                userId,
                userEmail,
                xavefId,
            };
          })
        );
        setTransactions(transactionsWithUserDetails);
      } catch (error) {
        console.error("Error attaching user details:", error);
        toast({
            variant: "destructive",
            title: "Error Processing Data",
            description: "Could not process transaction details.",
        });
        setTransactions([]);
      } finally {
        setLoading(false);
      }
    }

    attachUserDetails();

  }, [rawTransactions, firestore, rawLoading]);
  

  const isOverallLoading = loading || rawLoading;

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
          {isOverallLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : indexCreationUrl ? (
            <MissingIndexAlert url={indexCreationUrl} />
          ) : (
             transactions && <PendingTransactionsTable initialTransactions={transactions} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
