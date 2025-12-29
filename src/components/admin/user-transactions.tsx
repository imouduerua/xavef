
'use client';

import { useCollection, useFirestore } from '@/firebase';
import {
  Transaction,
  TransactionStatus,
} from '@/lib/types';
import { collection, orderBy, query } from 'firebase/firestore';
import React from 'react';
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
  const transactionsQuery = (firestore && userId) ? query(
      collection(firestore, 'users', userId, 'transactions'),
      orderBy('date', 'desc')
    ) : null;

  const { data: transactions, loading } =
    useCollection<Transaction>(transactionsQuery);

  const formatDate = (date: any) => {
    if (!date) return 'N/A';
    if (date.toDate) {
      return date.toDate().toLocaleDateString();
    }
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'Invalid Date';
    return d.toLocaleDateString();
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
                  amount > 0 ? 'text-green-600' : ''
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
