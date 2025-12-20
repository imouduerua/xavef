
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { PendingTransactionsTable } from '@/components/admin/pending-transactions-table';
import type { Transaction, UserData, TransactionWithUserDetails } from '@/lib/types';
import React, { useEffect, useState } from 'react';
import { toast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { useCollection, useFirestore } from '@/firebase';
import { collectionGroup, getDocs, query, where, doc, getDoc, orderBy } from 'firebase/firestore';
import { MissingIndexAlert } from '@/components/admin/missing-index-alert';


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

  const { data: rawTransactions, loading: rawLoading, error, indexCreationUrl } = useCollection<Transaction>(pendingTxsQuery);

  useEffect(() => {
    const processTransactions = async () => {
      if (rawLoading) {
        setLoading(true);
        return;
      }

      if (!rawTransactions || !firestore) {
        setTransactions(null);
        setLoading(false);
        return;
      }
      
      if (error) {
        console.error("Error fetching transactions:", error);
        toast({
            variant: "destructive",
            title: "Error Loading Data",
            description: "Could not load pending transactions.",
        });
        setTransactions([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const transactionsWithDetails = await Promise.all(
          rawTransactions.map(async (tx) => {
            const userId = tx.userId!;
            const userRef = doc(firestore, 'users', userId);
            const userSnap = await getDoc(userRef);
            
            const userEmail = userSnap.exists() ? (userSnap.data() as UserData).email : 'Unknown User';
            const xavefId = userSnap.exists() ? (userSnap.data() as UserData).xavefId : 'N/A';

            // Correctly merge the original transaction data with the new user details
            return {
                ...tx, // This preserves all original fields, including payoutAmount
                userId,
                userEmail,
                xavefId,
            } as TransactionWithUserDetails;
          })
        );
        setTransactions(transactionsWithDetails);
      } catch (err) {
        console.error("Error attaching user details:", err);
        toast({
            variant: "destructive",
            title: "Error Processing Data",
            description: "Could not process transaction details.",
        });
        setTransactions([]);
      } finally {
        setLoading(false);
      }
    };

    processTransactions();

  }, [rawTransactions, firestore, rawLoading, error]);
  
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
          ) : indexCreationUrl ? (
            <MissingIndexAlert url={indexCreationUrl} />
          ) : (
             transactions && <PendingTransactionsTable transactions={transactions} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
