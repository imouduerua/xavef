
'use client';
import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Skeleton } from '../ui/skeleton';
import { ArrowUpRight } from 'lucide-react';
import { Button } from '../ui/button';
import Link from 'next/link';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { collectionGroup, query, orderBy, limit } from 'firebase/firestore';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { TransactionWithUserDetails } from '@/lib/types';
import { MissingIndexAlert } from './missing-index-alert';

const formatDate = (date: any) => {
    if (!date) return 'N/A';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString();
};

function RecentTransactionsSkeleton() {
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
}

export function RecentTransactions() {
    const firestore = useFirestore();

    const transQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(
            collectionGroup(firestore, 'transactions'),
            orderBy('date', 'desc'),
            limit(5)
        );
    }, [firestore]);

    const { data: transactions, loading, indexCreationUrl } = useCollection<TransactionWithUserDetails>(transQuery);


  if (loading) {
    return <RecentTransactionsSkeleton />;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center">
        <div className="grid gap-2">
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>A log of the latest transactions on the platform.</CardDescription>
        </div>
         <Button asChild size="sm" className="ml-auto gap-1">
            <Link href="/admin/transactions">
                View All
                <ArrowUpRight className="h-4 w-4" />
            </Link>
        </Button>
      </CardHeader>
      <CardContent>
       {indexCreationUrl ? <MissingIndexAlert url={indexCreationUrl} /> :
        !transactions || transactions.length === 0 ? (
             <div className="text-center text-sm text-muted-foreground py-8">
                No transactions found.
            </div>
        ) : (
             <div className="space-y-4">
                {transactions.map((tx) => {
                    const amount = Number(tx.amount);
                    const isCredit = tx.type === 'Deposit' || tx.type === 'Group Payout' || tx.type === 'Interest';
                    return (
                        <div key={tx.id} className="flex items-center">
                            <Avatar className="h-9 w-9">
                                <AvatarFallback>{tx.userEmail?.[0].toUpperCase() ?? 'U'}</AvatarFallback>
                            </Avatar>
                            <div className="ml-4 space-y-1">
                                <p className="text-sm font-medium leading-none">{tx.description}</p>
                                <p className="text-sm text-muted-foreground">{tx.userEmail} &bull; {formatDate(tx.date)}</p>
                            </div>
                            <div className={`ml-auto font-medium ${isCredit ? 'text-green-600' : 'text-destructive'}`}>
                                {isCredit ? '+' : '-'}{`₦${Math.abs(amount).toFixed(2)}`}
                            </div>
                        </div>
                    )
                })}
            </div>
        )}
      </CardContent>
    </Card>
  );
}

RecentTransactions.Skeleton = RecentTransactionsSkeleton;
