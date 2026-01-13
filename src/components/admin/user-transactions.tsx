
'use client';

import { useCollection } from '@/firebase/firestore/use-collection';
import { useFirestore } from '@/firebase';
import { Transaction, TransactionStatus } from '@/lib/types';
import { collection, orderBy, query } from 'firebase/firestore';
import React, { useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { Skeleton } from '../ui/skeleton';
import { Badge } from '../ui/badge';

const statusVariant: Record<
  TransactionStatus,
  'default' | 'secondary' | 'destructive'
> = {
  Completed: 'default',
  Pending: 'secondary',
  Failed: 'destructive',
};

interface UserTransactionsProps {
  userId: string;
}

export function UserTransactions({ userId }: UserTransactionsProps) {
  const firestore = useFirestore();

  const transactionsQuery = useMemo(() => (userId && firestore)
    ? query(
        collection(firestore, 'users', userId, 'transactions'),
        orderBy('date', 'desc')
      )
    : null, [userId, firestore]);

  const { data: transactions, loading } =
    useCollection<Transaction>(transactionsQuery);

  const formatDate = (date: any) => {
    if (!date) return 'N/A';
    if (date.toDate) {
      return date.toDate().toLocaleString();
    }
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'Invalid Date';
    return d.toLocaleString();
  };

  if (loading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (!transactions || transactions.length === 0) {
    return <p>This user has no transactions.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Description</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Date</TableHead>
          <TableHead className="text-right">Amount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {transactions.map((tx) => {
          const amount = Number(tx.amount);
          return (
            <TableRow key={tx.id}>
              <TableCell className="font-medium">{tx.description}</TableCell>
              <TableCell>{tx.type}</TableCell>
              <TableCell>
                <Badge variant={statusVariant[tx.status]}>{tx.status}</Badge>
              </TableCell>
              <TableCell>{formatDate(tx.date)}</TableCell>
              <TableCell
                className={`text-right font-semibold ${
                  amount > 0 ? 'text-green-600' : 'text-destructive'
                }`}
              >
                {amount > 0
                  ? `+₦${amount.toFixed(2)}`
                  : `-₦${Math.abs(amount).toFixed(2)}`}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
