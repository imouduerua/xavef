
'use client';

import type { TransactionWithUserDetails } from '@/lib/types';
import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { Badge } from '../ui/badge';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Button } from '../ui/button';
import { MoreHorizontal, CheckCircle, XCircle, Loader2, Image as ImageIcon } from 'lucide-react';
import { useFirestore } from '@/firebase';
import { toast } from '@/hooks/use-toast';
import { updateTransactionStatus } from './actions';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import Image from 'next/image';

interface PendingTransactionsTableProps {
  transactions: TransactionWithUserDetails[];
}

const transactionTypeVariant: Record<
  string,
  'default' | 'secondary' | 'destructive' | 'outline' | null
> = {
  Deposit: 'default',
  Withdrawal: 'destructive',
};


export function PendingTransactionsTable({
  transactions,
}: PendingTransactionsTableProps) {
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const firestore = useFirestore();

  const handleUpdate = async (
    transactionPath: string,
    newStatus: 'Completed' | 'Failed'
  ) => {
    if (!firestore) return;
    setUpdatingId(transactionPath);
    const result = await updateTransactionStatus(firestore, transactionPath, newStatus);
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

  const formatDate = (date: any) => {
    if (!date) return 'N/A';
    if (date.toDate) {
      return date.toDate().toLocaleString();
    }
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'Invalid Date';
    return d.toLocaleString();
  };

  const formatCurrency = (amount?: number) => {
    if (amount === undefined || amount === null) return 'N/A';
    const sign = amount >= 0 ? '+' : '-';
    const colorClass = amount >= 0 ? 'text-green-600' : 'text-red-600';
    return <span className={colorClass}>{`${sign}₦${Math.abs(amount).toFixed(2)}`}</span>;
  };
  
  if (transactions.length === 0) {
      return <p className="text-center text-muted-foreground py-8">No pending transactions found.</p>
  }


  return (
    <div className="w-full overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Proof</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((tx) => (
            <TableRow key={tx.id}>
              <TableCell className="font-medium">
                <Link
                  href={`/admin/users/${tx.userId}`}
                  className="hover:underline"
                >
                  {tx.userEmail}
                </Link>
                <div className="text-xs text-muted-foreground">
                  ID: {tx.xavefId}
                </div>
              </TableCell>
              <TableCell>{formatDate(tx.date)}</TableCell>
              <TableCell>{tx.description}</TableCell>
              <TableCell>
                <Badge
                  variant={transactionTypeVariant[tx.type] || 'secondary'}
                >
                  {tx.type}
                </Badge>
              </TableCell>
              <TableCell>
                {tx.proofOfPaymentUrl ? (
                   <Dialog>
                        <DialogTrigger asChild>
                           <Button variant="outline" size="icon" className="h-8 w-8">
                                <ImageIcon className="h-4 w-4" />
                           </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Proof of Payment</DialogTitle>
                            </DialogHeader>
                            <div className="relative h-96 w-full">
                                <Image src={tx.proofOfPaymentUrl} alt="Proof of payment" layout="fill" objectFit="contain" />
                            </div>
                        </DialogContent>
                    </Dialog>
                ) : (
                    <span className="text-xs text-muted-foreground">None</span>
                )}
              </TableCell>
              <TableCell className="text-right font-semibold">
                {formatCurrency(tx.amount)}
              </TableCell>
              <TableCell className="text-right">
                {updatingId === tx.path ? (
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
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
