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
import { Check, Loader2, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

type TransactionWithUserDetails = Transaction & { userId: string, userEmail: string };

interface PendingTransactionsTableProps {
    initialTransactions: TransactionWithUserDetails[];
}

export function PendingTransactionsTable({ initialTransactions }: PendingTransactionsTableProps) {
  const [transactions, setTransactions] = React.useState<TransactionWithUserDetails[]>(initialTransactions);

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
          <TableHead className="text-center">Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {initialTransactions.map((tx) => {
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
                Pending
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
