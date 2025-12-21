
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
  const [transactionsWithDetails, setTransactionsWithDetails] = useState<
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
    if (rawLoading || !rawTransactions || !firestore) {
      if (transactionsWithDetails) setTransactionsWithDetails(null);
      return;
    }

    const processTransactions = async () => {
      try {
        const userCache = new Map<string, UserData>();
        const processed = await Promise.all(
          rawTransactions.map(async (tx) => {
            const pathParts = tx.path.split('/');
            const userId = pathParts[pathParts.indexOf('users') + 1];
            let user: UserData | undefined = userCache.get(userId);

            if (!user) {
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
        setTransactionsWithDetails(processed);
      } catch (err) {
        console.error('Error attaching user details:', err);
        toast({
          variant: 'destructive',
          title: 'Error Processing Data',
          description: 'Could not process transaction details.',
        });
        setTransactionsWithDetails([]); // Set to empty array on error
      }
    };

    processTransactions();
  }, [rawTransactions, firestore, transactionsWithDetails]);

  const renderContent = () => {
    // Highest priority: If an index is needed, show the alert.
    if (indexCreationUrl) {
      return <MissingIndexAlert url={indexCreationUrl} />;
    }
    
    // Second priority: If we're loading the initial data or processing it, show a skeleton.
    if (rawLoading || (rawTransactions && !transactionsWithDetails)) {
      return <Skeleton className="h-40 w-full" />;
    }

    // Third priority: If we have the processed data, show the table.
    if (transactionsWithDetails) {
      return <AllTransactionsTable transactions={transactionsWithDetails} />;
    }

    // Fallback: If there's no data and we're not loading (initial state), show skeleton.
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
