
'use client';

import type {
  Transaction,
  TransactionStatus,
  TransactionWithUserDetails,
  UserData,
} from '@/lib/types';
import React, { useEffect, useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import Link from 'next/link';
import { Badge } from '../ui/badge';
import { doc, getDoc, getDocs, collection, query, where, documentId } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { toast } from '@/hooks/use-toast';
import { Skeleton } from '../ui/skeleton';

interface AllTransactionsTableProps {
  transactions: Transaction[];
}

const statusVariant: Record<
  TransactionStatus,
  'default' | 'secondary' | 'destructive'
> = {
  Completed: 'default',
  Pending: 'secondary',
  Failed: 'destructive',
};

// New inner component to handle its own async data processing
function AllTransactionsTableContent({
  rawTransactions,
}: {
  rawTransactions: Transaction[] | null;
}) {
  const firestore = useFirestore();
  const [processedTransactions, setProcessedTransactions] = useState<
    TransactionWithUserDetails[] | null
  >(null);
  const [processing, setProcessing] = useState(true);

  useEffect(() => {
    let isMounted = true;
    if (!rawTransactions || !firestore) {
      if (isMounted) {
        setProcessedTransactions([]);
        setProcessing(false);
      }
      return;
    }

    const processTransactions = async () => {
      setProcessing(true);
      try {
        const userCache = new Map<string, UserData>();
        const userIds = [...new Set(rawTransactions.map(tx => {
            const pathParts = tx.path.split('/');
            return pathParts[pathParts.indexOf('users') + 1];
        }))];

        if (userIds.length > 0) {
            const usersRef = collection(firestore, 'users');
            // Firestore 'in' query is limited to 30 items.
            const usersQuery = query(usersRef, where(documentId(), 'in', userIds.slice(0, 30)));
            const userSnapshots = await getDocs(usersQuery);
            userSnapshots.forEach(userDoc => {
                userCache.set(userDoc.id, { id: userDoc.id, ...userDoc.data() } as UserData);
            });
        }
        
        const transactionsWithDetails = rawTransactions.map(tx => {
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
          toast({
            variant: 'destructive',
            title: 'Error Processing Data',
            description: 'Could not process transaction details.',
          });
          setProcessedTransactions([]);
        }
      } finally {
        if (isMounted) {
          setProcessing(false);
        }
      }
    };

    processTransactions();

    return () => {
      isMounted = false;
    };
  }, [rawTransactions, firestore]);

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
    return `${sign}₦${Math.abs(amount).toFixed(2)}`;
  };

  if (processing) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  if (!processedTransactions || processedTransactions.length === 0) {
    return <p>No transactions found.</p>;
  }

  return (
    <div className="w-full overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User Email</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {processedTransactions.map((tx) => {
            const amount = Number(tx.amount);
            return (
              <TableRow key={tx.id}>
                <TableCell className="font-medium break-all">
                  <Link
                    href={`/admin/users/${tx.userId}`}
                    className="hover:underline"
                  >
                    {tx.userEmail}
                  </Link>
                </TableCell>
                <TableCell>{formatDate(tx.date)}</TableCell>
                <TableCell>{tx.description}</TableCell>
                <TableCell>{tx.type}</TableCell>
                <TableCell>
                  <Badge variant={statusVariant[tx.status]}>{tx.status}</Badge>
                </TableCell>
                <TableCell
                  className={`text-right font-semibold ${
                    amount > 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {formatCurrency(amount)}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}


export function AllTransactionsTable({
  transactions: rawTransactions,
}: AllTransactionsTableProps) {
  // The AllTransactionsTable now just passes props to the inner component
  return <AllTransactionsTableContent rawTransactions={rawTransactions} />;
}
