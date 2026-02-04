'use client';

import React from 'react';
import { collectionGroup, query, orderBy, limit, where } from 'firebase/firestore';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { TransactionWithUserDetails } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '../ui/skeleton';
import { Badge } from '../ui/badge';
import { TransactionActions } from './transaction-actions';
import { MissingIndexAlert } from './missing-index-alert';

const statusVariant: Record<TransactionWithUserDetails['status'], 'default' | 'secondary' | 'destructive'> = {
  Completed: 'default',
  Pending: 'secondary',
  Failed: 'destructive',
};

const formatDate = (date: any) => {
  if (!date) return 'N/A';
  if (date.toDate) {
    return date.toDate().toLocaleString();
  }
  const d = new Date(date);
  if (isNaN(d.getTime())) return 'Invalid Date';
  return d.toLocaleString();
};

const PAGE_SIZE = 50;

function TableSkeleton() {
    return (
        <Card>
            <CardContent className="pt-6">
                 <div className="space-y-2">
                    {Array.from({ length: 10 }).map((_, i) => (
                        <Skeleton key={i} className="h-12 w-full" />
                    ))}
                 </div>
            </CardContent>
        </Card>
    );
}

type AllTransactionsTableProps = {
    status?: 'Pending' | 'Completed' | 'Failed';
}

export function AllTransactionsTable({ status }: AllTransactionsTableProps) {
  const firestore = useFirestore();

  const transactionsQuery = useMemoFirebase(() => {
    if (!firestore) return null;

    const baseQuery = collectionGroup(firestore, 'transactions');
    if (status) {
        return query(baseQuery, where('status', '==', status), orderBy('date', 'desc'), limit(PAGE_SIZE));
    }
    return query(baseQuery, orderBy('date', 'desc'), limit(PAGE_SIZE));
  }, [firestore, status]);

  const { data: transactions, loading, indexCreationUrl } = useCollection<TransactionWithUserDetails>(transactionsQuery);


  if (loading) {
    return <TableSkeleton />;
  }

  if (indexCreationUrl) {
    return <MissingIndexAlert url={indexCreationUrl} />;
  }
  
  if (!transactions || transactions.length === 0) {
    return (
        <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
                <p>No {status ? status.toLowerCase() : ''} transactions found.</p>
            </CardContent>
        </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">Payout</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((tx) => {
                const amount = Number(tx.amount);
                const userId = tx.path?.split('/')[1] || 'N/A';
                
                const isWithdrawal = tx.type === 'Withdrawal';
                let payoutAmount: number | null = null;

                if (isWithdrawal) {
                    if (tx.payoutAmount !== undefined && tx.payoutAmount !== null) {
                        payoutAmount = Number(tx.payoutAmount);
                    } else {
                        // Fallback calculation for older transactions
                        const withdrawalAmount = Math.abs(Number(tx.amount)) || 0;
                        const fee = withdrawalAmount * 0.033;
                        payoutAmount = withdrawalAmount - fee;
                    }
                }

                return (
                    <TableRow key={tx.id}>
                        <TableCell className="font-medium">{tx.userEmail || userId}</TableCell>
                        <TableCell>{tx.description}</TableCell>
                        <TableCell>{tx.type}</TableCell>
                        <TableCell>
                            <Badge variant={statusVariant[tx.status]}>{tx.status}</Badge>
                        </TableCell>
                        <TableCell>{formatDate(tx.date)}</TableCell>
                        <TableCell className={`text-right font-semibold ${tx.type === 'Deposit' || tx.type === 'Group Payout' ? 'text-green-600' : 'text-destructive'}`}>
                            {tx.type === 'Deposit' || tx.type === 'Group Payout' ? `+₦${amount.toFixed(2)}` : `-₦${Math.abs(amount).toFixed(2)}`}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                            {payoutAmount !== null ? `₦${payoutAmount.toFixed(2)}` : '—'}
                        </TableCell>
                        <TableCell className="text-center">
                           <TransactionActions userId={userId} transaction={tx} />
                        </TableCell>
                    </TableRow>
                )
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
