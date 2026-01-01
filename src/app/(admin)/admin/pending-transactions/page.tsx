
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { PendingTransactionsTable } from '@/components/admin/pending-transactions-table';
import type { Transaction, UserData, TransactionWithUserDetails } from '@/lib/types';
import React, { useEffect, useState, useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useCollection, useFirestore } from '@/firebase';
import { collection, collectionGroup, getDocs, query, where, doc, getDoc, orderBy, documentId } from 'firebase/firestore';
import { MissingIndexAlert } from '@/components/admin/missing-index-alert';
import { toast } from '@/hooks/use-toast';


export default function AdminPendingTransactionsPage() {
  const firestore = useFirestore();
  const [processedTransactions, setProcessedTransactions] = useState<TransactionWithUserDetails[] | null>(null);
  const [processing, setProcessing] = useState(true);

  const pendingTxsQuery = useMemo(() => {
    if (!firestore) return null;
    return query(
        collectionGroup(firestore, 'transactions'), 
        where('status', '==', 'Pending'),
        orderBy('date', 'desc')
    );
  }, [firestore]);

  const { data: rawTransactions, loading: rawLoading, indexCreationUrl } = useCollection<Transaction>(pendingTxsQuery);
  
  const rawTransactionsKey = useMemo(() => rawTransactions?.map(t => t.id).join(','), [rawTransactions]);

  useEffect(() => {
    let isMounted = true;
    if (!rawTransactions || !firestore) {
      if (rawLoading) {
         setProcessing(true);
      } else {
        if(isMounted) {
          setProcessedTransactions([]);
          setProcessing(false);
        }
      }
      return;
    }
    
    const processData = async () => {
      if (!isMounted) return;
      if (rawTransactions.length === 0) {
        setProcessedTransactions([]);
        setProcessing(false);
        return;
      }

      setProcessing(true);
      try {
        const userIds = [...new Set(rawTransactions.map(tx => {
          const pathParts = tx.path.split('/');
          return pathParts[pathParts.indexOf('users') + 1];
        }))];

        const usersCache = new Map<string, UserData>();
        // Batch fetch users
        if (userIds.length > 0) {
            const usersRef = collection(firestore, 'users');
            // Firestore 'in' query is limited to 30 items.
            // If you expect more than 30 users, you'd need to chunk this.
            if (userIds.length > 30) {
              console.warn("Processing more than 30 users, this might be slow or incomplete.");
            }
            const usersQuery = query(usersRef, where(documentId(), 'in', userIds.slice(0, 30)));
            const userSnapshots = await getDocs(usersQuery);
            userSnapshots.forEach(userDoc => {
                usersCache.set(userDoc.id, { id: userDoc.id, ...userDoc.data() } as UserData);
            });
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
        
        if (isMounted) {
            setProcessedTransactions(detailedTransactions);
        }
      } catch (err) {
        console.error("Error processing pending transactions:", err);
        if (isMounted) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Could not load user details for transactions."
            });
            setProcessedTransactions([]);
        }
      } finally {
        if (isMounted) {
            setProcessing(false);
        }
      }
    };
    
    processData();

    return () => {
        isMounted = false;
    };
  }, [rawTransactionsKey, firestore, rawLoading]);


  const renderContent = () => {
      if (indexCreationUrl) {
        return <MissingIndexAlert url={indexCreationUrl} />;
      }
      if (processing) {
        return <Skeleton className="h-64 w-full" />;
      }
      if (processedTransactions) {
        return <PendingTransactionsTable transactions={processedTransactions} />;
      }
      // This case handles when loading is done but there are no transactions
      return <PendingTransactionsTable transactions={[]} />;
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
