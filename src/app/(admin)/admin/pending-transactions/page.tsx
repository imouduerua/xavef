
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { PendingTransactionsTable } from '@/components/admin/pending-transactions-table';
import type { TransactionWithUserDetails, UserData } from '@/lib/types';
import React, { useEffect, useState, useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useCollection, useFirestore } from '@/firebase';
import { collection, collectionGroup, getDocs, query, where, doc, orderBy, documentId } from 'firebase/firestore';
import { MissingIndexAlert } from '@/components/admin/missing-index-alert';
import { toast } from '@/hooks/use-toast';

export default function AdminPendingTransactionsPage() {
  const firestore = useFirestore();
  const [transactions, setTransactions] = useState<TransactionWithUserDetails[]>([]);
  const [loading, setLoading] = useState(true);

  const pendingTxsQuery = useMemo(() => {
    if (!firestore) return null;
    return query(
      collectionGroup(firestore, 'transactions'),
      where('status', '==', 'Pending'),
      orderBy('date', 'desc')
    );
  }, [firestore]);

  const { data: rawTransactions, error, indexCreationUrl, loading: rawLoading } = useCollection<TransactionWithUserDetails>(pendingTxsQuery);
  
  // Create a stable key from the rawTransactions to use in the useEffect dependency array
  const rawTransactionsKey = useMemo(() => rawTransactions?.map(t => t.id).join(',') || '', [rawTransactions]);

  // Effect to process transactions once when rawTransactions are loaded
  useEffect(() => {
    if (rawLoading || !firestore) return;
    if (!rawTransactions) {
      setTransactions([]);
      setLoading(false);
      return;
    }

    const processData = async () => {
      setLoading(true);
      try {
        const userIds = [...new Set(rawTransactions.map(tx => {
          const pathParts = tx.path.split('/');
          return pathParts[pathParts.indexOf('users') + 1];
        }))];

        const usersCache = new Map<string, UserData>();
        if (userIds.length > 0) {
            const usersRef = collection(firestore, 'users');
            const chunks = [];
            for (let i = 0; i < userIds.length; i += 30) {
              chunks.push(userIds.slice(i, i + 30));
            }
            for (const chunk of chunks) {
               const usersQuery = query(usersRef, where(documentId(), 'in', chunk));
               const userSnapshots = await getDocs(usersQuery);
               userSnapshots.forEach(userDoc => {
                  usersCache.set(userDoc.id, { id: userDoc.id, ...userDoc.data() } as UserData);
               });
            }
        }
        
        const detailedTransactions = rawTransactions.map(tx => {
            const pathParts = tx.path.split('/');
            const userId = pathParts[pathParts.indexOf('users') + 1];
            const user = usersCache.get(userId);
            return {
              ...tx,
              userId,
              userEmail: user?.email || 'Unknown User',
              xavefId: user?.xavefId || 'N/A',
            } as TransactionWithUserDetails;
        });

        setTransactions(detailedTransactions);

      } catch (err) {
        console.error("Error processing pending transactions:", err);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not load user details for transactions."
        });
        setTransactions([]);
      } finally {
        setLoading(false);
      }
    };
    
    processData();

  }, [rawTransactionsKey, firestore, rawLoading]);


  const handleTransactionUpdate = (transactionId: string) => {
    setTransactions(prev => prev.filter(tx => tx.id !== transactionId));
  }


  const renderContent = () => {
    if (indexCreationUrl) {
      return <MissingIndexAlert url={indexCreationUrl} />;
    }
    if (loading) {
      return <Skeleton className="h-64 w-full" />;
    }
    return <PendingTransactionsTable transactions={transactions} onUpdate={handleTransactionUpdate} />;
  }
  
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Pending Transactions</CardTitle>
          <CardDescription>
            Review all pending deposits and withdrawals before they are
            processed.
          </CardDescription>
        </CardHeader>
        <CardContent>
            {renderContent()}
        </CardContent>
      </Card>
    </div>
  );
}
