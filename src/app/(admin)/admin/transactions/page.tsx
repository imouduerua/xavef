
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type {
  Transaction,
  UserData,
  TransactionWithUserDetails,
} from '@/lib/types';
import React, { useMemo, useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useCollection, useFirestore } from '@/firebase';
import {
  collection,
  collectionGroup,
  orderBy,
  query,
  where,
  documentId,
  getDocs,
} from 'firebase/firestore';
import { MissingIndexAlert } from '@/components/admin/missing-index-alert';
import { AllTransactionsTable } from '@/components/admin/all-transactions-table';
import { toast } from '@/hooks/use-toast';

function AllTransactionsPageContent() {
  const [processedTransactions, setProcessedTransactions] = useState<
    TransactionWithUserDetails[] | null
  >(null);
  const [processing, setProcessing] = useState(true);
  const firestore = useFirestore();

  const allTxsQuery = useMemo(
    () =>
      firestore ? query(collectionGroup(firestore, 'transactions'), orderBy('date', 'desc')) : null,
    [firestore]
  );

  const {
    data: rawTransactions,
    loading: rawLoading,
    indexCreationUrl,
  } = useCollection<Transaction>(allTxsQuery);
  
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
  }, [rawTransactionsKey, rawLoading, firestore]);


  const renderContent = () => {
    if (indexCreationUrl) {
      return <MissingIndexAlert url={indexCreationUrl} />;
    }

    if (rawLoading || processing) {
      return <Skeleton className="h-64 w-full" />;
    }

    return <AllTransactionsTable transactions={processedTransactions || []} />;
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Global Transaction History</CardTitle>
          <CardDescription>
            A complete log of all transactions across the platform.
          </CardDescription>
        </CardHeader>
        <CardContent>{renderContent()}</CardContent>
      </Card>
    </div>
  );
}

export default function AllTransactionsPage() {
    // This page is protected by the admin layout's super admin check
    return <AllTransactionsPageContent />;
}
