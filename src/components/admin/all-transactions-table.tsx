
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
import { doc, getDoc } from 'firebase/firestore';
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

export function AllTransactionsTable({
  transactions: rawTransactions,
}: AllTransactionsTableProps) {
  const firestore = useFirestore();
  const [userCache, setUserCache] = useState<Map<string, UserData>>(new Map());
  const [processing, setProcessing] = useState(true);

  const processedTransactions = useMemo(() => {
    if (!rawTransactions) return null;
    if (rawTransactions.length === 0) {
        setProcessing(false);
        return [];
    }

    const unmappedTransactions = rawTransactions.filter(tx => {
        const pathParts = tx.path.split('/');
        const userId = pathParts[pathParts.indexOf('users') + 1];
        return !userCache.has(userId);
    });

    if (unmappedTransactions.length > 0 && firestore) {
        setProcessing(true);
        const fetchUnmappedUsers = async () => {
            const newUserCache = new Map(userCache);
            await Promise.all(
                unmappedTransactions.map(async (tx) => {
                    const pathParts = tx.path.split('/');
                    const userId = pathParts[pathParts.indexOf('users') + 1];
                     if (!newUserCache.has(userId)) {
                        const userRef = doc(firestore, 'users', userId);
                        const userSnap = await getDoc(userRef);
                        if (userSnap.exists()) {
                            const fetchedUser = { id: userSnap.id, ...userSnap.data() } as UserData;
                            newUserCache.set(userId, fetchedUser);
                        }
                    }
                })
            );
            setUserCache(newUserCache);
            setProcessing(false);
        };
        fetchUnmappedUsers();
    } else if (unmappedTransactions.length === 0) {
        setProcessing(false);
    }
    
     if (processing) {
      return null;
    }

    return rawTransactions.map(tx => {
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

  }, [rawTransactions, firestore, userCache, processing]);

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

  if (processing || processedTransactions === null) {
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
