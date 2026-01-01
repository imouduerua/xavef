
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { Transaction } from '@/lib/types';
import React, { useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useCollection, useFirestore } from '@/firebase';
import { collectionGroup, orderBy, query } from 'firebase/firestore';
import { MissingIndexAlert } from '@/components/admin/missing-index-alert';
import { SuperAdminAuthGuard } from '@/components/admin/super-admin-auth-guard';
import { AllTransactionsTable } from '@/components/admin/all-transactions-table';

function AllTransactionsPageContent() {
  const firestore = useFirestore();

  const allTxsQuery = firestore ? query(
      collectionGroup(firestore, 'transactions'),
      orderBy('date', 'desc')
    ) : null;

  const {
    data: rawTransactions,
    loading: rawLoading,
    indexCreationUrl,
  } = useCollection<Transaction>(allTxsQuery);

  const renderContent = () => {
    if (indexCreationUrl) {
      return <MissingIndexAlert url={indexCreationUrl} />;
    }

    if (rawLoading) {
      return <Skeleton className="h-64 w-full" />;
    }

    if (rawTransactions) {
      return <AllTransactionsTable transactions={rawTransactions} />;
    }

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
