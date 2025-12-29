
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


function PendingTransactionsContent({ rawTransactions, firestore }: { rawTransactions: Transaction[] | null, firestore: any }) {
  const [processedTransactions, setProcessedTransactions] = useState<TransactionWithUserDetails[] | null>(null);
  const [processing, setProcessing] = useState(true);

  useEffect(() => {
    let isMounted = true;
    if (!rawTransactions || !firestore) {
      setProcessedTransactions([]);
      setProcessing(false);
      return;
    };

    const processTransactions = async () => {
      if (!rawTransactions) return;
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
                 const fetchedUser = { id: userSnap.id, ...userSnap.data() } as UserData;
                 userCache.set(userId, fetchedUser);
                 user = fetchedUser;
              }
            }
            
            const userEmail = user ? user.email : 'Unknown User';
            const xavefId = user ? user.xavefId : 'N/A';

            return {
                ...tx,
                userId,
                userEmail,
                xavefId,
            } as TransactionWithUserDetails;
          })
        );
        if (isMounted) {
            setProcessedTransactions(transactionsWithDetails);
        }
      } catch (err) {
        console.error("Error attaching user details:", err);
         if (isMounted) {
            toast({
                variant: "destructive",
                title: "Error Processing Data",
                description: "Could not process transaction details.",
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
    }
  }, [rawTransactions, firestore]);

  if (processing) {
    return <Skeleton className="h-40 w-full" />;
  }

  if (processedTransactions) {
    return <PendingTransactionsTable transactions={processedTransactions} />;
  }

  return null;
}


export default function AdminPendingTransactionsPage() {
  const firestore = useFirestore();

  const pendingTxsQuery = useMemo(() => {
    if (!firestore) return null;
    return query(
        collectionGroup(firestore, 'transactions'), 
        where('status', '==', 'Pending'),
        orderBy('date', 'desc')
    );
  }, [firestore]);

  const { data: rawTransactions, loading: rawLoading, indexCreationUrl } = useCollection<Transaction>(pendingTxsQuery);
  
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
            {indexCreationUrl ? (
                <MissingIndexAlert url={indexCreationUrl} />
            ) : rawLoading ? (
                <Skeleton className="h-40 w-full" />
            ) : (
                <PendingTransactionsContent rawTransactions={rawTransactions} firestore={firestore} />
            )}
        </CardContent>
      </Card>
    </div>
  );
}
