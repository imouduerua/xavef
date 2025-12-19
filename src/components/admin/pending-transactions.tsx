'use client';

import { useCollection, useFirestore } from '@/firebase';
import type { Transaction } from '@/lib/types';
import { collectionGroup, query, where, getDocs, doc } from 'firebase/firestore';
import React, { startTransition } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { Skeleton } from '../ui/skeleton';
import { Button } from '../ui/button';
import { Check, Loader2, X } from 'lucide-react';
import { updateTransactionStatus } from '@/app/(admin)/admin/actions';
import { toast } from '@/hooks/use-toast';

type TransactionWithUserDetails = Transaction & { userId: string, userEmail: string };

export function PendingTransactions() {
  const firestore = useFirestore();
  const [transactions, setTransactions] = React.useState<TransactionWithUserDetails[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [updatingIds, setUpdatingIds] = React.useState<string[]>([]);

  const fetchPendingTransactions = React.useCallback(async () => {
    setLoading(true);
    const transactionsQuery = query(
      collectionGroup(firestore, 'transactions'),
      where('status', '==', 'Pending')
    );
    
    const querySnapshot = await getDocs(transactionsQuery);
    const transactionsData: TransactionWithUserDetails[] = [];

    for (const txDoc of querySnapshot.docs) {
      const data = txDoc.data() as Transaction;
      const userId = txDoc.ref.parent.parent?.id; // Get the user ID from the path
      if (userId) {
        const userDocRef = doc(firestore, 'users', userId);
        // This part is simplified. In a real app, you might fetch user data
        // or have the email already on the transaction document.
        // For now, we'll just add the ID.
         transactionsData.push({ ...data, id: txDoc.id, userId, userEmail: `user-${userId.substring(0,5)}...` });
      }
    }
    
    setTransactions(transactionsData);
    setLoading(false);
  }, [firestore]);


  React.useEffect(() => {
    fetchPendingTransactions();
  }, [fetchPendingTransactions]);

  const handleUpdateStatus = async (userId: string, transactionId: string, newStatus: 'Completed' | 'Failed') => {
    setUpdatingIds(prev => [...prev, transactionId]);
    
    startTransition(async () => {
      const result = await updateTransactionStatus({ userId, transactionId, newStatus });
      if (result.success) {
        toast({
          title: `Transaction ${newStatus === 'Completed' ? 'Approved' : 'Declined'}`,
        });
        // Refetch or optimistically update UI
        setTransactions(prev => prev.filter(tx => tx.id !== transactionId));
      } else {
        toast({
          variant: 'destructive',
          title: 'Update Failed',
          description: result.error,
        });
      }
      setUpdatingIds(prev => prev.filter(id => id !== transactionId));
    });
  };


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
    return <p>No pending transactions found.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>User ID</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Description</TableHead>
          <TableHead>Type</TableHead>
          <TableHead className="text-right">Amount</TableHead>
          <TableHead className="text-center">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {transactions.map((tx) => {
          const isUpdating = updatingIds.includes(tx.id);
          return (
            <TableRow key={tx.id}>
              <TableCell className="font-medium truncate max-w-[100px]">{tx.userId}</TableCell>
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
