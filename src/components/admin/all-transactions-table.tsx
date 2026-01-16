'use client';

import React, { useEffect, useState } from 'react';
import { collectionGroup, query, orderBy, limit, where, FirestoreError, onSnapshot } from 'firebase/firestore';
import { useFirestore, useUser } from '@/firebase';
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
  const { user, loading: authLoading } = useUser();
  const [transactions, setTransactions] = useState<TransactionWithUserDetails[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [indexCreationUrl, setIndexCreationUrl] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading || !firestore || !user) {
        if (!authLoading) {
            setLoading(false);
        }
        return;
    }

    setLoading(true);
    setIndexCreationUrl(null);

    const baseQuery = collectionGroup(firestore, 'transactions');
    let q;

    if (status) {
        q = query(baseQuery, where('status', '==', status), orderBy('date', 'desc'), limit(PAGE_SIZE));
    } else {
        q = query(baseQuery, orderBy('date', 'desc'), limit(PAGE_SIZE));
    }

    const unsubscribe = onSnapshot(q, 
        (snapshot) => {
            const results = snapshot.docs.map(doc => ({
                ...doc.data(),
                id: doc.id,
                path: doc.ref.path,
            } as TransactionWithUserDetails));
            setTransactions(results);
            setLoading(false);
        }, 
        (error: FirestoreError) => {
            if (
                error.code === 'failed-precondition' &&
                error.message.includes('requires an index')
            ) {
                const urlMatch = error.message.match(/https?:\/\/console\.firebase\.google\.com\S+/);
                if (urlMatch) {
                    setIndexCreationUrl(urlMatch[0]);
                }
            } else {
                console.error("Error fetching transactions:", error);
            }
            setLoading(false);
            setTransactions(null);
        }
    );

    return () => unsubscribe();
  }, [firestore, status, user, authLoading]);


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
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((tx) => {
                const amount = Number(tx.amount);
                const userId = tx.path?.split('/')[1] || 'N/A';
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
