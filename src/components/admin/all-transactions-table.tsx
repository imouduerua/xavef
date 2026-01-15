
'use client';

import React, { useMemo } from 'react';
import { collectionGroup, query, orderBy, limit, startAfter, endBefore, limitToLast, DocumentData } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { useCollection } from '@/firebase/firestore/use-collection';
import { TransactionWithUserDetails, UserData } from '@/lib/types';
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

export function AllTransactionsTable() {
  const firestore = useFirestore();
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageDocs, setPageDocs] = React.useState<(DocumentData | null)[]>([null]); // doc snapshots for pagination
  const [paginationDirection, setPaginationDirection] = React.useState<'next' | 'prev' | null>(null);

  const transactionsQuery = useMemo(() => {
    if (!firestore) return null;
    const baseQuery = query(collectionGroup(firestore, 'transactions'), orderBy('date', 'desc'));
    
    if (paginationDirection === 'next' && pageDocs[currentPage - 1]) {
      return query(baseQuery, startAfter(pageDocs[currentPage - 1]), limit(PAGE_SIZE));
    }
    if (paginationDirection === 'prev' && pageDocs[currentPage]) {
        // Firestore doesn't have a simple "previous" cursor, so we reverse the query and then the results.
        const reversedQuery = query(collectionGroup(firestore, 'transactions'), orderBy('date', 'asc'));
        return query(reversedQuery, startAfter(pageDocs[currentPage-1]), limit(PAGE_SIZE));
    }

    return query(baseQuery, limit(PAGE_SIZE));
  }, [firestore, currentPage, pageDocs, paginationDirection]);


  const { data: transactions, loading, indexCreationUrl } = useCollection<TransactionWithUserDetails>(transactionsQuery);

  const handleNextPage = () => {
    if (!transactions || transactions.length < PAGE_SIZE) return;
    setPaginationDirection('next');
    // @ts-ignore
    setPageDocs(prev => [...prev, transactions[transactions.length - 1].__snapshot]);
    setCurrentPage(prev => prev + 1);
  };
  
  const handlePrevPage = () => {
    if (currentPage === 1) return;
    setPaginationDirection('prev');
     setCurrentPage(prev => prev - 1);
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
            <CardContent className="pt-6">
                <p>No transactions found.</p>
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
                // Extract userId from path, which is like 'users/{userId}/transactions/{txId}'
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
         <div className="flex items-center justify-end space-x-2 py-4">
            <Button
                variant="outline"
                size="sm"
                onClick={handlePrevPage}
                disabled={currentPage === 1}
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
      </CardContent>
    </Card>
  );
}
