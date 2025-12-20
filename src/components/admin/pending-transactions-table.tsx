
'use client';

import type { Transaction } from '@/lib/types';
import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { Button } from '../ui/button';
import { Check, Loader2, X, Download } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useFirestore } from '@/firebase';
import { updateTransactionStatus } from './actions';
import type { Timestamp } from 'firebase/firestore';

type TransactionWithUserDetails = Transaction & { userId: string, userEmail: string, xavefId: string };

interface PendingTransactionsTableProps {
    initialTransactions: TransactionWithUserDetails[];
}

export function PendingTransactionsTable({ initialTransactions }: PendingTransactionsTableProps) {
  const [transactions, setTransactions] = React.useState<TransactionWithUserDetails[]>(initialTransactions);
  const [updatingId, setUpdatingId] = React.useState<string | null>(null);
  const firestore = useFirestore();

  const handleUpdateStatus = async (
    userId: string,
    transactionId: string,
    newStatus: 'Completed' | 'Failed'
  ) => {
    setUpdatingId(transactionId);
    try {
        const result = await updateTransactionStatus(firestore, userId, transactionId, newStatus);
        if (result.success) {
            toast({
                title: 'Transaction Updated',
                description: `Transaction has been marked as ${newStatus}.`,
            });
            // Remove the processed transaction from the local state to update the UI
            setTransactions(prev => prev.filter(tx => tx.id !== transactionId));
        } else {
             toast({
                variant: 'destructive',
                title: 'Update Failed',
                description: result.error || 'An unknown error occurred.',
            });
        }
    } catch (error: any) {
        toast({
            variant: 'destructive',
            title: 'Update Failed',
            description: error.message || 'An unexpected server error occurred.',
        });
    } finally {
        setUpdatingId(null);
    }
  };


  if (transactions.length === 0) {
    return <p>No pending transactions found.</p>;
  }

  const formatDate = (date: any) => {
    if (!date) return 'N/A';
    // Firebase Timestamps have a toDate() method
    if (date.toDate) {
      return date.toDate().toLocaleString();
    }
    // Fallback for string/number dates
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'Invalid Date';
    return d.toLocaleString();
  };

  const formatCurrency = (amount?: number) => {
    if (amount === undefined || amount === null) return 'N/A';
    const sign = amount >= 0 ? '+' : '-';
    return `${sign}₦${Math.abs(amount).toFixed(2)}`;
  }

  return (
    <div className="w-full overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User Email</TableHead>
            <TableHead>Xavef ID</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Type</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead className="text-right">Fee</TableHead>
            <TableHead className="text-right">Payout</TableHead>
            <TableHead className="text-center">Proof</TableHead>
            <TableHead className="text-center">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((tx) => {
            const isUpdating = updatingId === tx.id;
            const amount = Number(tx.amount);

            return (
              <TableRow key={tx.id}>
                <TableCell className="font-medium break-all">{tx.userEmail}</TableCell>
                <TableCell>{tx.xavefId}</TableCell>
                <TableCell>{formatDate(tx.date)}</TableCell>
                <TableCell>{tx.type}</TableCell>
                <TableCell
                  className={`text-right font-semibold ${
                    amount > 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {formatCurrency(amount)}
                </TableCell>
                 <TableCell className="text-right text-muted-foreground">
                  {tx.fee !== undefined ? `₦${tx.fee.toFixed(2)}` : 'N/A'}
                </TableCell>
                <TableCell className="text-right font-semibold">
                  {tx.payoutAmount !== undefined ? `₦${tx.payoutAmount.toFixed(2)}` : 'N/A'}
                </TableCell>
                <TableCell className="text-center">
                  {tx.proofOfPaymentUrl ? (
                    <Button variant="outline" size="icon" className="h-8 w-8" asChild>
                      <a href={tx.proofOfPaymentUrl} download={`receipt-${tx.id}.png`}>
                        <Download className="h-4 w-4" />
                      </a>
                    </Button>
                  ) : (
                    <span className="text-xs text-muted-foreground">N/A</span>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex flex-col sm:flex-row gap-2 justify-center">
                      {isUpdating ? (
                        <Button variant="outline" size="sm" disabled>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Updating...
                        </Button>
                      ) : (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-green-600 border-green-600 hover:bg-green-50 hover:text-green-700"
                            onClick={() => handleUpdateStatus(tx.userId, tx.id, 'Completed')}
                          >
                            <Check className="mr-2 h-4 w-4" />
                            Approve
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 border-red-600 hover:bg-red-50 hover:text-red-700"
                            onClick={() => handleUpdateStatus(tx.userId, tx.id, 'Failed')}
                          >
                            <X className="mr-2 h-4 w-4" />
                            Decline
                          </Button>
                        </>
                      )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
