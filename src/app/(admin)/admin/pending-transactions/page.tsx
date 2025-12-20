

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
import React, { useEffect, useState } from 'react';
import { toast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { getPendingTransactionsAction } from './actions';

type TransactionWithUserDetails = Transaction & {
  userId: string;
  userEmail: string;
};

export default function AdminPendingTransactionsPage() {
  const [data, setData] = useState<{
    transactions: TransactionWithUserDetails[] | null;
    error?: string;
  }>({ transactions: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getPendingTransactions() {
      setLoading(true);
      const result = await getPendingTransactionsAction();
      if (result.transactions) {
        setData({ transactions: result.transactions });
      } else {
        setData({
          transactions: null,
          error: result.error,
        });
        toast({
            variant: "destructive",
            title: "Error",
            description: result.error || "Could not fetch pending transactions."
        })
      }
      setLoading(false);
    }

    getPendingTransactions();
  }, []);

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
          {loading && <Skeleton className="h-40 w-full" />}
          {data.error && <p className="text-destructive">{data.error}</p>}
          {!loading && data.transactions && (
            <PendingTransactionsTable initialTransactions={data.transactions} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
