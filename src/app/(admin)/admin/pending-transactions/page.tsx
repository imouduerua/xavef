
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
import { toast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { useCollection, useFirestore } from '@/firebase';
import { collectionGroup, getDocs, query, where, doc, getDoc, orderBy } from 'firebase/firestore';
import { MissingIndexAlert } from '@/components/admin/missing-index-alert';


export default function AdminPendingTransactionsPage() {
  const firestore = useFirestore();
  const [userCache, setUserCache] = useState<Map<string, UserData>>(new Map());
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


  const renderContent = () => {
      if (indexCreationUrl) {
        return <MissingIndexAlert url={indexCreationUrl} />;
      }
      if (rawLoading || processing || processedTransactions === null) {
        return <Skeleton className="h-40 w-full" />;
      }
      if (processedTransactions) {
        return <PendingTransactionsTable transactions={processedTransactions} />;
      }
      return <p>No pending transactions found.</p>
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
