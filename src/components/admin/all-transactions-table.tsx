'use client';

import React, { useMemo } from 'react';
import { collectionGroup, query, orderBy, limit, startAfter, endBefore, limitToLast, DocumentData, Query, where } from 'firebase/firestore';
import { useFirestore, useMemoFirebase } from '@/firebase';
import { useCollection } from '@/firebase/firestore/use-collection';
import { TransactionWithUserDetails } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '../ui/skeleton';
import { Badge } from '../ui/badge';
import { TransactionActions } from './transaction-actions';
import { Button } from '../ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
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

const PAGE_SIZE = 10;

function TableSkeleton() {
    return (
        <Card>
            <CardContent className="pt-6">
                 <div className="space-y-2">
                    {Array.from({ length: PAGE_SIZE }).map((_, i) => (
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
  const [lastVisible, setLastVisible] = React.useState<DocumentData | null>(null);
  const [firstVisible, setFirstVisible] = React.useState<DocumentData | null>(null);
  const [page, setPage] = React.useState(1);
  const [currentQuery, setCurrentQuery] = React.useState<Query | null>(null);

  const getQuery = (constraints: any[] = []) => {
      let q = query(collectionGroup(firestore!, 'transactions'), orderBy('date', 'desc'));
      if (status) {
          q = query(q, where('status', '==', status));
      }
      return query(q, ...constraints);
  }

  const transactionsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return getQuery([limit(PAGE_SIZE)])
  }, [firestore, status]);

  const nextPageQuery = useMemoFirebase(() => {
    if (!firestore || !lastVisible) return null;
    return getQuery([startAfter(lastVisible), limit(PAGE_SIZE)])
  }, [firestore, status, lastVisible]);
  
  const prevPageQuery = useMemoFirebase(() => {
    if (!firestore || !firstVisible) return null;
    return getQuery([endBefore(firstVisible), limitToLast(PAGE_SIZE)])
  }, [firestore, status, firstVisible]);

  React.useEffect(() => {
      setCurrentQuery(transactionsQuery);
      setPage(1);
  }, [transactionsQuery]);
  
  const { data: transactions, loading, indexCreationUrl } = useCollection<TransactionWithUserDetails>(currentQuery);

  React.useEffect(() => {
      if (transactions && transactions.length > 0) {
        // @ts-ignore
          setFirstVisible(transactions[0].__snapshot);
          // @ts-ignore
          setLastVisible(transactions[transactions.length - 1].__snapshot);
      } else {
          setFirstVisible(null);
          setLastVisible(null);
      }
  }, [transactions]);


  const handleNextPage = () => {
    if (nextPageQuery) {
        setCurrentQuery(nextPageQuery);
        setPage(page + 1);
    }
  };
  
  const handlePrevPage = () => {
    if (prevPageQuery) {
        setCurrentQuery(prevPageQuery);
        setPage(page - 1);
    }
  };

  if (indexCreationUrl) {
    return <MissingIndexAlert url={indexCreationUrl} />;
  }

  if (loading) {
    return <TableSkeleton />;
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
                        <TableCell className={`text-right font-semibold ${tx.type === 'Deposit' || tx.type === 'Group Payout' ? 'text-green-600' : 'text-red-600'}`}>
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
         <div className="flex items-center justify-between space-x-2 py-4">
            <div className="text-sm text-muted-foreground">Page {page}</div>
            <div className="flex items-center space-x-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrevPage}
                    disabled={page === 1}
                >
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Previous
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNextPage}
                    disabled={transactions.length < PAGE_SIZE}
                >
                    Next
                    <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
