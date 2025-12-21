
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { Transaction } from '@/lib/types';
import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useCollection, useFirestore } from '@/firebase';
import { collectionGroup, orderBy, query } from 'firebase/firestore';
import { MissingIndexAlert } from '@/components/admin/missing-index-alert';
import { SuperAdminAuthGuard } from '@/components/admin/super-admin-auth-guard';
import { AllTransactionsTable } from '@/components/admin/all-transactions-table';

function AllTransactionsPageContent() {
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

  // This is the core logic that will now be strictly sequential.
  const renderContent = () => {
    // Priority 1: The most critical check. If an index is required, stop everything
    // and show the alert.
    if (indexCreationUrl) {
      return <MissingIndexAlert url={indexCreationUrl} />;
    }

    // Priority 2: If we are still fetching the initial data, show a skeleton loader.
    if (rawLoading) {
      return <Skeleton className="h-64 w-full" />;
    }

    // Priority 3: If we have the data, render the table. The table component itself
    // is responsible for handling the display of the data, including attaching user details.
    if (rawTransactions) {
      return <AllTransactionsTable transactions={rawTransactions} />;
    }

    // Fallback: This will show for a brief moment on initial load before the query is built
    // or if there's an unhandled error state.
    return <Skeleton className="h-64 w-full" />;
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
  );
}
