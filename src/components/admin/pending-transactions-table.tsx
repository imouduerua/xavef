
'use client';

import type { TransactionWithUserDetails, UserData } from '@/lib/types';
import React, { useEffect, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { Button } from '../ui/button';
import { Check, Loader2, X, Download, Clock } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useFirestore } from '@/firebase';
import { updateTransactionStatus } from './actions';
import Link from 'next/link';
import { doc, getDoc } from 'firebase/firestore';
import { Skeleton } from '../ui/skeleton';

interface PendingTransactionsTableProps {
    transactions: TransactionWithUserDetails[];
}


// New inner component to handle its own async data processing
function PendingTransactionsTableContent({
  rawTransactions,
  firestore,
}: {
  rawTransactions: any[] | null;
  firestore: any;
}) {
  const [transactions, setTransactions] = useState<TransactionWithUserDetails[] | null>(null);
  const [processing, setProcessing] = useState(true);
  const [updatingId, setUpdatingId] = React.useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    if (!rawTransactions || !firestore) {
      setTransactions([]);
      setProcessing(false);
      return;
    }

    const processTransactions = async () => {
      setProcessing(true);
      try {
        const userCache = new Map<string, UserData>();
        const transactionsWithDetails = await Promise.all(
          rawTransactions.map(async (tx) => {
            const pathParts = tx.path.split('/');
            const userId = pathParts[pathParts.indexOf('users') + 1];
            let user: UserData | undefined = userCache.get(userId);

            if (!user) {
              const userRef = doc(firestore, 'users', userId);
              const userSnap = await getDoc(userRef);
              if (userSnap.exists()) {
                const fetchedUser = {
                  id: userSnap.id,
                  ...userSnap.data(),
                } as UserData;
                userCache.set(userId, fetchedUser);
                user = fetchedUser;
              }
            }

            return {
              ...tx,
              userId,
              userEmail: user?.email || 'Unknown User',
              xavefId: user?.xavefId || 'N/A',
            } as TransactionWithUserDetails;
          })
        );
        if (isMounted) {
          setTransactions(transactionsWithDetails);
        }
      } catch (err) {
        console.error('Error attaching user details:', err);
        if (isMounted) {
          toast({
            variant: 'destructive',
            title: 'Error Processing Data',
            description: 'Could not process transaction details.',
          });
          setTransactions([]);
        }
      } finally {
        if (isMounted) {
          setProcessing(false);
        }
      }
    };

    processTransactions();
    
    return () => { isMounted = false; };
  }, [rawTransactions, firestore]);
  
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
            // Optimistically remove the transaction from the table
            setTransactions(prev => prev ? prev.filter(tx => tx.id !== transactionId) : []);
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


  if (processing) {
    return (
       <div className="space-y-2">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }
  
  if (!transactions || transactions.length === 0) {
    return (
       <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/20 p-12 text-center">
        <Clock className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">No Pending Transactions</h3>
        <p className="mb-4 mt-2 text-sm text-muted-foreground">
          All transactions have been reviewed.
        </p>
      </div>
    );
  }

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
                <TableCell className="font-medium break-all">
                  <Link href={`/admin/users/${tx.userId}`} className="hover:underline">
                    {tx.userEmail}
                  </Link>
                </TableCell>
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
                <TableCell className="text-right font-semibold">
                  {typeof tx.payoutAmount === 'number'
                    ? `₦${tx.payoutAmount.toFixed(2)}`
                    : 'N/A'}
                </TableCell>
                <TableCell className="text-center">
                  {tx.proofOfPaymentUrl ? (
                    <Button variant="outline" size="icon" className="h-8 w-8" asChild>
                      <a href={tx.proofOfPaymentUrl} download={`receipt-for-${tx.id}.png`} target="_blank" rel="noopener noreferrer">
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


export function PendingTransactionsTable({
  transactions: rawTransactions,
}: PendingTransactionsTableProps) {
  const firestore = useFirestore();

  return <PendingTransactionsTableContent rawTransactions={rawTransactions} firestore={firestore} />;
}
