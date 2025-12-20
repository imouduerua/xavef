'use client';

import type { Transaction } from '@/lib/types';
import React, { startTransition } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { Button } from '../ui/button';
import { Check, Loader2, X } from 'lucide-react';
import { updateTransactionStatus } from '@/app/(admin)/admin/actions';
import { toast } from '@/hooks/use-toast';

type TransactionWithUserDetails = Transaction & { userId: string, userEmail: string };

interface PendingTransactionsTableProps {
    initialTransactions: TransactionWithUserDetails[];
}

export function PendingTransactionsTable({ initialTransactions }: PendingTransactionsTableProps) {
  const [transactions, setTransactions] = React.useState<TransactionWithUserDetails[]>(initialTransactions);
  const [updatingIds, setUpdatingIds] = React.useState<string[]>([]);

  const handleUpdateStatus = (userId: string, transactionId: string, newStatus: 'Completed' | 'Failed') => {
    setUpdatingIds(prev => [...prev, transactionId]);
    
    startTransition(() => {
      // Optimistically update the UI
      setTransactions(prev => prev.filter(tx => tx.id !== transactionId));

      // Perform the server action in the background
      updateTransactionStatus({ userId, transactionId, newStatus }).then(result => {
        if (result.success) {
          toast({
            title: `Transaction ${newStatus === 'Completed' ? 'Approved' : 'Declined'}`,
          });
        } else {
          toast({
            variant: 'destructive',
            title: 'Update Failed',
            description: result.error,
          });
          // Revert the optimistic update on failure by re-fetching or adding the item back
          // For this app, we'll rely on a page refresh or re-navigation to see the failed item again.
        }
        setUpdatingIds(prev => prev.filter(id => id !== transactionId));
      });
    });
  };

  if (transactions.length === 0) {
    return <p>No pending transactions found.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>User Email</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Description</TableHead>
          <TableHead>Type</TableHead>
          <TableHead className="text-right">Amount</TableHead>
          <TableHead className="text-center">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {initialTransactions.map((tx) => {
          const isUpdating = updatingIds.includes(tx.id);
          const isRemoved = !transactions.some(t => t.id === tx.id);

          if (isRemoved) return null;

          return (
            <TableRow key={tx.id}>
              <TableCell className="font-medium truncate max-w-[150px]">{tx.userEmail}</TableCell>
              <TableCell>{new Date(tx.date).toLocaleDateString()}</TableCell>
              <TableCell>{tx.description}</TableCell>
              <TableCell>{tx.type}</TableCell>
              <TableCell
                className={`text-right font-semibold ${
                  tx.amount > 0 ? 'text-green-600' : ''
                }`}
              >
                {tx.amount > 0
                  ? `+₦${tx.amount.toFixed(2)}`
                  : `-₦${Math.abs(tx.amount).toFixed(2)}`}
              </TableCell>
              <TableCell className="text-center space-x-2">
                {isUpdating ? (
                    <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                ) : (
                    <>
                        <Button variant="outline" size="icon" className="h-8 w-8 bg-green-50 hover:bg-green-100 text-green-700" onClick={() => handleUpdateStatus(tx.userId, tx.id, 'Completed')}>
                            <Check className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="icon" className="h-8 w-8 bg-red-50 hover:bg-red-100 text-red-700" onClick={() => handleUpdateStatus(tx.userId, tx.id, 'Failed')}>
                            <X className="h-4 w-4" />
                        </Button>
                    </>
                )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
