
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { PendingTransactionsTable } from '@/components/admin/pending-transactions-table';
import type { TransactionWithUserDetails } from '@/lib/types';
import React, { useState, useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useCollection, useFirestore } from '@/firebase';
import {
  collectionGroup,
  query,
  where,
  orderBy,
} from 'firebase/firestore';
import { MissingIndexAlert } from '@/components/admin/missing-index-alert';

export default function AdminPendingTransactionsPage() {
  const firestore = useFirestore();
  
  const pendingTxsQuery = useMemo(() => {
    if (!firestore) return null;
    return query(
      collectionGroup(firestore, 'transactions'),
      where('status', '==', 'Pending'),
      orderBy('date', 'desc')
    );
  }, [firestore]);

  const {
    data: transactions,
    loading,
    indexCreationUrl,
  } = useCollection<TransactionWithUserDetails>(pendingTxsQuery);
  
  const [processedTransactions, setProcessedTransactions] = useState<TransactionWithUserDetails[] | null>(transactions);

  React.useEffect(() => {
    setProcessedTransactions(transactions);
  }, [transactions]);


  const handleTransactionUpdate = (transactionId: string) => {
    setProcessedTransactions(prev => prev ? prev.filter(tx => tx.id !== transactionId) : null);
  }

  const renderContent = () => {
    if (indexCreationUrl) {
      return <MissingIndexAlert url={indexCreationUrl} />;
    }
    if (loading && !processedTransactions) {
      return <Skeleton className="h-64 w-full" />;
    }
    return <PendingTransactionsTable transactions={processedTransactions || []} onUpdate={handleTransactionUpdate} />;
  }
  
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
            {renderContent()}
        </CardContent>
      </Card>
    </div>
  );
}
