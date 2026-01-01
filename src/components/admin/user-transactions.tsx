
'use client';

import { useCollection, useFirestore } from '@/firebase';
import { Transaction, TransactionStatus } from '@/lib/types';
import { collection, orderBy, query } from 'firebase/firestore';
import React, { useMemo, useState } from 'react';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Button } from '../ui/button';
import {
  MoreHorizontal,
  CheckCircle,
  XCircle,
  Loader2,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { updateTransactionStatus } from './actions';

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
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const transactionsQuery = useMemo(
    () =>
      firestore && userId
        ? query(
            collection(firestore, 'users', userId, 'transactions'),
            orderBy('date', 'desc')
          )
        : null,
    [firestore, userId]
  );

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

  const handleUpdate = async (
    transactionPath: string,
    newStatus: 'Completed' | 'Failed'
  ) => {
    if (!firestore) return;
    setUpdatingId(transactionPath);
    const result = await updateTransactionStatus(
      firestore,
      transactionPath,
      newStatus
    );
    if (result.success) {
      toast({
        title: 'Transaction Updated',
        description: `The transaction has been marked as ${newStatus}.`,
      });
    } else {
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: result.error,
      });
    }
    setUpdatingId(null);
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
          <TableHead className="text-right">Actions</TableHead>
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
                  amount > 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {amount > 0
                  ? `+₦${amount.toFixed(2)}`
                  : `-₦${Math.abs(amount).toFixed(2)}`}
              </TableCell>
              <TableCell className="text-right">
                {tx.status === 'Pending' ? (
                  updatingId === tx.path ? (
                    <Loader2 className="h-5 w-5 animate-spin ml-auto" />
                  ) : (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleUpdate(tx.path, 'Completed')}
                        >
                          <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                          <span>Approve</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-500"
                          onClick={() => handleUpdate(tx.path, 'Failed')}
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          <span>Decline</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )
                ) : (
                  <span className="text-xs text-muted-foreground">Processed</span>
                )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
