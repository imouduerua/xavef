'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type {
  Transaction,
  TransactionWithUserDetails,
} from '@/lib/types';
import React, { useEffect, useState } from 'react';
import { toast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { useCollection, useFirestore } from '@/firebase';
import {
  collectionGroup,
  getDoc,
  doc,
  orderBy,
  query,
} from 'firebase/firestore';
import { MissingIndexAlert } from '@/components/admin/missing-index-alert';
import { SuperAdminAuthGuard } from '@/components/admin/super-admin-auth-guard';
import { AllTransactionsTable } from '@/components/admin/all-transactions-table';

function AllTransactionsPageContent() {
  const [transactions, setTransactions] = useState<
    TransactionWithUserDetails[] | null
  >(null);
  const [loading, setLoading] = useState(true);
  const firestore = useFirestore();

  const allTxsQuery = React.useMemo(() => {
    if (!firestore) return null;
    return query(
      collectionGroup(firestore, 'transactions'),
      orderBy('date', 'desc')
    );
  }, [firestore]);

  const {
    data: rawTransactions,
    loading: rawLoading,
    error,
    indexCreationUrl,
  } = useCollection<Transaction>(allTxsQuery);

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
        console.error('Error fetching transactions:', error);
        toast({
          variant: 'destructive',
          title: 'Error Loading Data',
          description: 'Could not load transaction history.',
        });
        setTransactions([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const transactionsWithDetails = await Promise.all(
          rawTransactions.map(async (tx) => {
            const pathParts = tx.path.split('/');
            const userId = pathParts[pathParts.indexOf('users') + 1];

            const userRef = doc(firestore, 'users', userId);
            const userSnap = await getDoc(userRef);

            const userEmail = userSnap.exists()
              ? userSnap.data().email
              : 'Unknown User';
            const xavefId = userSnap.exists() ? userSnap.data().xavefId : 'N/A';

            return {
              ...tx,
              userId,
              userEmail,
              xavefId,
            } as TransactionWithUserDetails;
          })
        );
        setTransactions(transactionsWithDetails);
      } catch (err) {
        console.error('Error attaching user details:', err);
        toast({
          variant: 'destructive',
          title: 'Error Processing Data',
          description: 'Could not process transaction details.',
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
          <CardTitle>Global Transaction History</CardTitle>
          <CardDescription>
            A complete log of all transactions across the platform.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-40 w-full" />
          ) : indexCreationUrl ? (
            <MissingIndexAlert url={indexCreationUrl} />
          ) : (
            transactions && <AllTransactionsTable transactions={transactions} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}


export default function AllTransactionsPage() {
    return (
        <SuperAdminAuthGuard>
            <AllTransactionsPageContent />
        </SuperAdminAuthGuard>
    )
}
