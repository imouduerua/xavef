
'use client';

import type { Transaction, UserData } from '@/lib/types';
import React from 'react';
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
import Link from 'next/link';

interface GroupTransactionsTableProps {
  transactions: Transaction[] | null;
  membersMap: Map<string, UserData>;
  loading: boolean;
}

export function GroupTransactionsTable({ transactions, membersMap, loading }: GroupTransactionsTableProps) {

  const formatDate = (date: any) => {
    if (!date) return 'N/A';
    if (date.toDate) {
      return date.toDate().toLocaleString();
    }
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'Invalid Date';
    return d.toLocaleString();
  };
  
  const formatCurrency = (amount: number) =>
    `₦${amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;


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
    return <p className="text-sm text-muted-foreground">No transactions found for this group yet.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Member</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Type</TableHead>
          <TableHead className="text-right">Amount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {transactions.map((tx) => {
            // The user ID is in the path: /users/{userId}/transactions/{txId}
            const pathParts = tx.path.split('/');
            const userId = pathParts[pathParts.indexOf('users') + 1];
            const member = membersMap.get(userId);

            return (
                <TableRow key={tx.id}>
                    <TableCell className="font-medium">
                        {member?.displayName || 'Unknown Member'}
                    </TableCell>
                    <TableCell>{formatDate(tx.date)}</TableCell>
                    <TableCell>
                        <Badge variant={tx.type === 'Group Payout' ? 'default' : 'secondary'}>
                            {tx.type}
                        </Badge>
                    </TableCell>
                    <TableCell className={`text-right font-semibold ${tx.type === 'Group Payout' ? 'text-green-600' : ''}`}>
                       {formatCurrency(tx.amount)}
                    </TableCell>
                </TableRow>
            )
        })}
      </TableBody>
    </Table>
  );
}

