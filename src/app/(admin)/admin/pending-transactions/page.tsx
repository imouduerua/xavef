
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { PendingTransactionsTable } from '@/components/admin/pending-transactions-table';
import type { Transaction } from '@/lib/types';
import React, { useState, useMemo, useCallback, useEffect } from 'react';
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
  
  const pendingTxsQuery = useMemo(() => firestore ? query(
      collectionGroup(firestore, 'transactions'),
      where('status', '==', 'Pending'),
      orderBy('date', 'desc')
    ) : null, [firestore]);

  const {
    data: initialTransactions,
    loading,
    indexCreationUrl,
  } = useCollection<Transaction>(pendingTxsQuery);
  
  const [transactions, setTransactions] = useState<Transaction[] | null>(null);

  useEffect(() => {
    if (initialTransactions) {
      setTransactions(initialTransactions);
    }
  }, [initialTransactions]);

  const handleTransactionUpdate = useCallback((transactionId: string) => {
    setTransactions(prev => prev ? prev.filter(tx => tx.id !== transactionId) : null);
  }, []);

  const renderContent = () => {
    if (indexCreationUrl) {
      return <MissingIndexAlert url={indexCreationUrl} />;
    }
    if (loading && !transactions) {
      return <Skeleton className="h-64 w-full" />;
    }
    return <PendingTransactionsTable transactions={transactions || []} onUpdate={handleTransactionUpdate} />;
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
