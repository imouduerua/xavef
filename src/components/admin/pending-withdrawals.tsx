
'use client';
import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Skeleton } from '../ui/skeleton';
import { Button } from '../ui/button';
import { ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collectionGroup, query, where, orderBy, limit } from 'firebase/firestore';
import { TransactionWithUserDetails } from '@/lib/types';
import { MissingIndexAlert } from './missing-index-alert';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { TransactionActions } from './transaction-actions';


function PendingWithdrawalsSkeleton() {
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
}


export function PendingWithdrawals() {
    const firestore = useFirestore();

    const withdrawalsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(
            collectionGroup(firestore, 'transactions'),
            where('type', '==', 'Withdrawal'),
            where('status', '==', 'Pending'),
            orderBy('date', 'desc'),
            limit(5)
        );
    }, [firestore]);
    
    const { data: withdrawals, loading, indexCreationUrl } = useCollection<TransactionWithUserDetails>(withdrawalsQuery);


    if (loading) {
        return <PendingWithdrawalsSkeleton />;
    }

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
         {indexCreationUrl ? <MissingIndexAlert url={indexCreationUrl} /> :
          !withdrawals || withdrawals.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground py-8">
                No pending withdrawals.
            </div>
          ) : (
            <div className="space-y-4">
                {withdrawals.map((tx) => {
                    const amount = Number(tx.amount);
                    const userId = tx.path?.split('/')[1] || 'N/A';
                    return (
                        <div key={tx.id} className="flex items-center">
                            <Avatar className="h-9 w-9">
                                <AvatarFallback>{tx.userEmail?.[0].toUpperCase() ?? 'U'}</AvatarFallback>
                            </Avatar>
                            <div className="ml-4 space-y-1">
                                <p className="text-sm font-medium leading-none">{tx.userEmail}</p>
                                <p className="text-sm text-muted-foreground">{tx.destinationBankName}</p>
                            </div>
                            <div className="ml-auto text-right">
                               <p className="font-medium">{`₦${Math.abs(amount).toFixed(2)}`}</p>
                               <TransactionActions userId={userId} transaction={tx} />
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

PendingWithdrawals.Skeleton = PendingWithdrawalsSkeleton;
