
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
  UserData,
} from '@/lib/types';
import React, { useEffect, useState } from 'react';
import { toast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { useCollection, useFirestore } from '@/firebase';
import {
  collectionGroup,
  doc,
  getDoc,
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
    indexCreationUrl,
  } = useCollection<Transaction>(allTxsQuery);

  useEffect(() => {
    if (rawLoading || indexCreationUrl || !rawTransactions) {
      return;
    }

    const processTransactions = async () => {
      try {
        const userCache = new Map<string, UserData>();

        const transactionsWithDetails = await Promise.all(
          rawTransactions.map(async (tx) => {
            const pathParts = tx.path.split('/');
            const userId = pathParts[pathParts.indexOf('users') + 1];
            let user: UserData | undefined = userCache.get(userId);

            if (!user && firestore) {
              const userRef = doc(firestore, 'users', userId);
              const userSnap = await getDoc(userRef);
              if (userSnap.exists()) {
                 const fetchedUser = { id: userSnap.id, ...userSnap.data() } as UserData;
                 userCache.set(userId, fetchedUser);
                 user = fetchedUser;
              }
            }

            const userEmail = user?.email || 'Unknown User';
            const xavefId = user?.xavefId || 'N/A';

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
      }
    };

    processTransactions();
  }, [rawTransactions, firestore, rawLoading, indexCreationUrl]);

  const renderContent = () => {
    if (rawLoading) {
      return <Skeleton className="h-40 w-full" />;
    }
    if (indexCreationUrl) {
      return <MissingIndexAlert url={indexCreationUrl} />;
    }
    if (transactions) {
      return <AllTransactionsTable transactions={transactions} />;
    }
    return <Skeleton className="h-40 w-full" />;
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Global Transaction History</CardTitle>
          <CardDescription>
            A complete log of all transactions across the platform.
          </CardDescription>
        </CardHeader>
        <CardContent>{renderContent()}</CardContent>
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
