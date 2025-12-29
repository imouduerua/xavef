
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
import { collectionGroup, getDoc, query, where, doc, orderBy } from 'firebase/firestore';
import { MissingIndexAlert } from '@/components/admin/missing-index-alert';


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
  
  useEffect(() => {
    // This effect will run when rawTransactions are fetched or changed.
    if (rawLoading) {
      setProcessing(true);
      return;
    }
    if (!rawTransactions || !firestore) {
      setProcessedTransactions([]);
      setProcessing(false);
      return;
    }
    
    let isMounted = true;
    const processData = async () => {
      if (rawTransactions.length === 0) {
        setProcessedTransactions([]);
        setProcessing(false);
        return;
      }

      setProcessing(true);
      const userCache = new Map<string, UserData>();
      
      const detailedTransactions = await Promise.all(
        rawTransactions.map(async (tx) => {
          const pathParts = tx.path.split('/');
          const userId = pathParts[pathParts.indexOf('users') + 1];
          let user = userCache.get(userId);
          
          if (!user) {
            try {
              const userRef = doc(firestore, 'users', userId);
              const userSnap = await getDoc(userRef);
              if (userSnap.exists()) {
                const fetchedUser = userSnap.data() as UserData;
                userCache.set(userId, fetchedUser);
                user = fetchedUser;
              }
            } catch (error) {
              console.error(`Failed to fetch user ${userId}`, error);
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
          setProcessedTransactions(detailedTransactions);
          setProcessing(false);
      }
    };
    
    processData();

    return () => {
        isMounted = false;
    };
  }, [rawTransactions, firestore, rawLoading]);


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
