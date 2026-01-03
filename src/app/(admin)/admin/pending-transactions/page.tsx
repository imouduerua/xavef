
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
import React, { useState, useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useFirestore } from '@/firebase/provider';
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
  } = useCollection<Transaction>(pendingTxsQuery);
  
  const [processedTransactionIds, setProcessedTransactionIds] = useState<string[]>([]);

  const handleTransactionUpdate = (transactionId: string) => {
    setProcessedTransactionIds(prev => [...prev, transactionId]);
  }
  
  const filteredTransactions = useMemo(() => {
    if (!transactions) return [];
    return transactions.filter(tx => !processedTransactionIds.includes(tx.id));
  }, [transactions, processedTransactionIds]);


  const renderContent = () => {
    if (indexCreationUrl) {
      return <MissingIndexAlert url={indexCreationUrl} />;
    }
    if (loading && !transactions) {
      return <Skeleton className="h-64 w-full" />;
    }
    return <PendingTransactionsTable transactions={filteredTransactions} onUpdate={handleTransactionUpdate} />;
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
