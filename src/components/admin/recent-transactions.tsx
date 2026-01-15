
'use client';
import React from 'react';
import { collectionGroup, query, where, orderBy, limit } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { useCollection } from '@/firebase/firestore/use-collection';
import type { TransactionWithUserDetails } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '../ui/skeleton';
import { ArrowUpRight } from 'lucide-react';
import { Button } from '../ui/button';
import Link from 'next/link';

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

export function RecentTransactions() {
  const firestore = useFirestore();
  const transactionsQuery = React.useMemo(() => {
    if (!firestore) return null;
    return query(
        collectionGroup(firestore, 'transactions'),
        where('status', '==', 'Completed'),
        orderBy('date', 'desc'),
        limit(5)
    );
  }, [firestore]);

  const { data: transactions, loading } = useCollection<TransactionWithUserDetails>(transactionsQuery);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center">
        <div className="grid gap-2">
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>A log of the latest completed transactions.</CardDescription>
        </div>
         <Button asChild size="sm" className="ml-auto gap-1">
            <Link href="/admin/transactions">
                View All
                <ArrowUpRight className="h-4 w-4" />
            </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : !transactions || transactions.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No recent transactions.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell>
                    <div className="font-medium">{tx.userDisplayName || 'N/A'}</div>
                    <div className="text-xs text-muted-foreground">{tx.userEmail}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{tx.type}</Badge>
                  </TableCell>
                  <TableCell className={`text-right font-semibold ${tx.type === 'Deposit' ? 'text-green-600' : 'text-red-600'}`}>
                    {tx.type === 'Deposit' ? `+₦${Number(tx.amount).toFixed(2)}` : `-₦${Math.abs(Number(tx.amount)).toFixed(2)}`}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

RecentTransactions.Skeleton = function SkeletonComponent() {
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
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </CardContent>
    </Card>
  );
};
