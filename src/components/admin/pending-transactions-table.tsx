
'use client';

import type { TransactionWithUserDetails, UserData } from '@/lib/types';
import React, { useState, useEffect, useMemo } from 'react';
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
import { collection, doc, getDoc, getDocs, query, where, documentId } from 'firebase/firestore';


interface PendingTransactionsTableProps {
  transactions: TransactionWithUserDetails[];
  onUpdate: (transactionId: string) => void;
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
  onUpdate
}: PendingTransactionsTableProps) {
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const firestore = useFirestore();
  const [usersCache, setUsersCache] = useState<Map<string, UserData>>(new Map());
  const [loadingUsers, setLoadingUsers] = useState(true);

  const transactionIds = useMemo(() => transactions.map(t => t.id).join(','), [transactions]);

  useEffect(() => {
    let isMounted = true;
    const fetchUsers = async () => {
      if (!firestore || transactions.length === 0) {
        setLoadingUsers(false);
        return;
      }
      setLoadingUsers(true);
      const userIds = [...new Set(transactions.map(tx => {
        const pathParts = tx.path.split('/');
        return pathParts[pathParts.indexOf('users') + 1];
      }))];

      const newUsersToFetch = userIds.filter(id => !usersCache.has(id));
      if (newUsersToFetch.length === 0) {
        if(isMounted) setLoadingUsers(false);
        return;
      }
      
      const newCache = new Map(usersCache);
      
      try {
        const chunks: string[][] = [];
        for (let i = 0; i < newUsersToFetch.length; i += 30) {
          chunks.push(newUsersToFetch.slice(i, i + 30));
        }

        for (const chunk of chunks) {
            const usersQuery = query(collection(firestore, 'users'), where(documentId(), 'in', chunk));
            const userSnapshots = await getDocs(usersQuery);
            if (isMounted) {
              userSnapshots.forEach(userDoc => {
                  newCache.set(userDoc.id, { id: userDoc.id, ...userDoc.data() } as UserData);
              });
            }
        }
        if (isMounted) {
            setUsersCache(newCache);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        if (isMounted) {
            toast({ variant: "destructive", title: "Error", description: "Could not load user details." });
        }
      } finally {
        if (isMounted) {
            setLoadingUsers(false);
        }
      }
    };

    fetchUsers();
    return () => { isMounted = false; };
  }, [transactionIds, firestore]);

  const handleUpdate = async (
    transactionId: string,
    transactionPath: string,
    newStatus: 'Completed' | 'Failed'
  ) => {
    if (!firestore) return;
    setUpdatingId(transactionId);
    const result = await updateTransactionStatus(firestore, transactionPath, newStatus);
    if (result.success) {
      toast({
        title: 'Transaction Updated',
        description: `The transaction has been marked as ${newStatus}.`,
      });
      onUpdate(transactionId);
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
          {transactions.map((tx) => {
             const pathParts = tx.path.split('/');
             const userId = pathParts[pathParts.indexOf('users') + 1];
             const user = usersCache.get(userId);

            return (
              <TableRow key={tx.id}>
                <TableCell className="font-medium">
                  <Link
                    href={`/admin/users/${userId}`}
                    className="hover:underline"
                  >
                    {user?.email || (loadingUsers ? '...' : 'Unknown')}
                  </Link>
                  <div className="text-xs text-muted-foreground">
                    ID: {user?.xavefId || '...'}
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
                                  <Image src={tx.proofOfPaymentUrl} alt="Proof of payment" fill objectFit="contain" />
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
                  {updatingId === tx.id ? (
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
                          onClick={() => handleUpdate(tx.id, tx.path, 'Completed')}
                        >
                          <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                          <span>Approve</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-500"
                          onClick={() => handleUpdate(tx.id, tx.path, 'Failed')}
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          <span>Decline</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  );
}
