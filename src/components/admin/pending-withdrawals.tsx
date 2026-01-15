

'use client';
import React from 'react';
import { collectionGroup, query, where, orderBy, limit } from 'firebase/firestore';
import { useFirestore, useMemoFirebase } from '@/firebase';
import { useCollection } from '@/firebase/firestore/use-collection';
import type { TransactionWithUserDetails } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '../ui/skeleton';
import { TransactionActions } from './transaction-actions';
import { Button } from '../ui/button';
import { ArrowUpRight } from 'lucide-react';
import Link from 'next/link';

const formatDate = (date: any) => {
  if (!date) return 'N/A';
  if (date.toDate) {
    return date.toDate().toLocaleString();
  }
  const d = new Date(date);
  if (isNaN(d.getTime())) return 'Invalid Date';
  return d.toLocaleString();
};

export function PendingWithdrawals() {
  const firestore = useFirestore();
  const transactionsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
        collectionGroup(firestore, 'transactions'),
        where('status', '==', 'Pending'),
        where('type', '==', 'Withdrawal'),
        orderBy('date', 'asc'),
        limit(5)
    );
  }, [firestore]);

  const { data: transactions, loading } = useCollection<TransactionWithUserDetails>(transactionsQuery);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center">
        <div className="grid gap-2">
            <CardTitle>Pending Withdrawals</CardTitle>
            <CardDescription>Review and process the latest withdrawal requests.</CardDescription>
        </div>
        <Button asChild size="sm" className="ml-auto gap-1">
            <Link href="/admin/transactions?tab=pending">
                View All
                <ArrowUpRight className="h-4 w-4" />
            </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : !transactions || transactions.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No pending withdrawals.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((tx) => {
                 const userId = tx.path?.split('/')[1] || 'N/A';
                 return (
                    <TableRow key={tx.id}>
                        <TableCell>
                            <div className="font-medium">{tx.userDisplayName || 'N/A'}</div>
                            <div className="text-xs text-muted-foreground">{tx.userEmail}</div>
                        </TableCell>
                        <TableCell>{formatDate(tx.date)}</TableCell>
                        <TableCell className="text-right font-semibold text-red-600">
                            -₦{Number(tx.amount).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-center">
                            <TransactionActions userId={userId} transaction={tx} />
                        </TableCell>
                    </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

PendingWithdrawals.Skeleton = function SkeletonComponent() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </CardContent>
    </Card>
  );
};
