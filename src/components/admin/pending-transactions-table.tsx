
'use client';

import type { TransactionWithUserDetails, UserData } from '@/lib/types';
import React, { useEffect, useMemo, useState } from 'react';
import { useCollection, useFirestore } from '@/firebase';
import {
  collectionGroup,
  doc,
  documentId,
  getDocs,
  orderBy,
  query,
  where,
} from 'firebase/firestore';
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
  CheckCircle,
  Loader2,
  MoreHorizontal,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';
import { handleTransactionUpdate } from '@/app/(admin)/admin/actions';
import { toast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { MissingIndexAlert } from './missing-index-alert';

export function PendingTransactionsTable() {
  const [processedTransactions, setProcessedTransactions] = useState<
    TransactionWithUserDetails[]
  >([]);
  const [processing, setProcessing] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const firestore = useFirestore();

  const pendingTxsQuery = useMemo(
    () =>
      firestore
        ? query(
            collectionGroup(firestore, 'transactions'),
            where('status', '==', 'Pending'),
            orderBy('date', 'desc')
          )
        : null,
    [firestore]
  );

  const {
    data: rawTransactions,
    loading: rawLoading,
    indexCreationUrl,
  } = useCollection<TransactionWithUserDetails>(pendingTxsQuery);
  
  const rawTransactionsKey = useMemo(() => rawTransactions?.map(t => t.id).join(',') || '', [rawTransactions]);


  useEffect(() => {
    let isMounted = true;
    if (!rawTransactions || !firestore) {
      if (!rawLoading) {
          setProcessedTransactions([]);
          setProcessing(false);
      }
      return;
    }

    const processTransactions = async () => {
      if (!isMounted) return;
      setProcessing(true);
      try {
        const userIds = [
          ...new Set(
            rawTransactions.map((tx) => {
              const pathParts = tx.path.split('/');
              return pathParts[pathParts.indexOf('users') + 1];
            })
          ),
        ];

        const userCache = new Map<string, UserData>();
        if (userIds.length > 0) {
          const usersRef = collection(firestore, 'users');
          const chunks: string[][] = [];
           for (let i = 0; i < userIds.length; i += 30) {
              chunks.push(userIds.slice(i, i + 30));
           }

          for (const chunk of chunks) {
              if (chunk.length > 0) {
                const usersQuery = query(
                    usersRef,
                    where(documentId(), 'in', chunk)
                );
                const userSnapshots = await getDocs(usersQuery);
                userSnapshots.forEach((userDoc) => {
                    userCache.set(
                    userDoc.id,
                    { id: userDoc.id, ...userDoc.data() } as UserData
                    );
                });
              }
          }
        }
        
        const transactionsWithDetails = rawTransactions.map((tx) => {
          const pathParts = tx.path.split('/');
          const userId = pathParts[pathParts.indexOf('users') + 1];
          const user = userCache.get(userId);

          return {
            ...tx,
            userId,
            userEmail: user?.email || 'Unknown User',
            xavefId: user?.xavefId || 'N/A',
          } as TransactionWithUserDetails;
        });

        if (isMounted) {
          setProcessedTransactions(transactionsWithDetails);
        }
      } catch (err) {
        console.error('Error attaching user details:', err);
        if (isMounted) {
           setProcessedTransactions([]);
        }
      } finally {
        if (isMounted) {
          setProcessing(false);
        }
      }
    };

    processTransactions();

    return () => { isMounted = false; }
  }, [rawTransactionsKey, firestore, rawLoading]);


  const handleUpdate = async (
    transactionPath: string,
    newStatus: 'Completed' | 'Failed'
  ) => {
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

  const formatCurrency = (amount?: number) => {
    if (amount === undefined || amount === null) return 'N/A';
    return `₦${Math.abs(amount).toFixed(2)}`;
  };
  
  if (indexCreationUrl) {
    return <MissingIndexAlert url={indexCreationUrl} />;
  }

  if (rawLoading || processing) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (!processedTransactions || processedTransactions.length === 0) {
    return <p className="text-center text-muted-foreground py-8">No pending transactions found.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>User</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {processedTransactions.map((tx) => {
          const isUpdating = updatingId === tx.id;
          return (
            <TableRow key={tx.id}>
              <TableCell>
                 <Link href={`/admin/users/${tx.userId}`} className="font-medium hover:underline">
                    {tx.userEmail}
                  </Link>
                  <div className="text-xs text-muted-foreground">{tx.xavefId}</div>
              </TableCell>
              <TableCell>{formatDate(tx.date)}</TableCell>
              <TableCell>
                <Badge variant={tx.type === 'Deposit' ? 'default' : 'destructive'}>{tx.type}</Badge>
              </TableCell>
              <TableCell className="font-semibold">
                {formatCurrency(tx.amount)}
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="h-8 w-8 p-0"
                      disabled={isUpdating}
                    >
                      <span className="sr-only">Open menu</span>
                      {isUpdating ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <MoreHorizontal className="h-4 w-4" />
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem
                      onClick={() => handleUpdate(tx.path, 'Completed')}
                    >
                      <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                      Approve
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleUpdate(tx.path, 'Failed')}
                    >
                      <XCircle className="mr-2 h-4 w-4 text-red-500" />
                      Decline
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
