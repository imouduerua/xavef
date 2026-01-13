
'use client';

import { useCollection } from '@/firebase/firestore/use-collection';
import { useFirestore } from '@/firebase';
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
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { CheckCircle, MoreHorizontal, XCircle, Loader2 } from 'lucide-react';
import { handleTransactionUpdate } from '@/app/(admin)/admin/actions';
import { toast } from '@/hooks/use-toast';

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

  const transactionsQuery = useMemo(() => (userId && firestore)
    ? query(
        collection(firestore, 'users', userId, 'transactions'),
        orderBy('date', 'desc')
      )
    : null, [userId, firestore]);

  const { data: transactions, loading } =
    useCollection<Transaction>(transactionsQuery);

  const handleUpdate = async (transactionPath: string, newStatus: 'Completed' | 'Failed') => {
    const txId = transactionPath.split('/').pop() || '';
    setUpdatingId(txId);
    try {
        const result = await handleTransactionUpdate(transactionPath, newStatus);
        if (result.success) {
            toast({
                title: 'Transaction Updated',
                description: `The transaction has been marked as ${newStatus}.`,
            });
        } else {
             throw new Error(result.error || 'An unknown error occurred.');
        }
    } catch (error: any) {
        toast({
            variant: 'destructive',
            title: 'Update Failed',
            description: error.message,
        });
    } finally {
        setUpdatingId(null);
    }
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
          const isUpdating = updatingId === tx.id;
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
                  amount > 0 ? 'text-green-600' : 'text-destructive'
                }`}
              >
                {amount > 0
                  ? `+₦${amount.toFixed(2)}`
                  : `-₦${Math.abs(amount).toFixed(2)}`}
              </TableCell>
              <TableCell className="text-right">
                {tx.status === 'Pending' ? (
                   <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0" disabled={isUpdating}>
                            <span className="sr-only">Open menu</span>
                            {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreHorizontal className="h-4 w-4" />}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleUpdate(tx.path, 'Completed')}>
                            <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                            Approve
                        </DropdownMenuItem>
                         <DropdownMenuItem onClick={() => handleUpdate(tx.path, 'Failed')}>
                            <XCircle className="mr-2 h-4 w-4 text-red-500" />
                            Decline
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                   </DropdownMenu>
                ) : (
                  <span className="text-xs text-muted-foreground">-</span>
                )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
