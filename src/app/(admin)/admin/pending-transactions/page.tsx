'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { PendingTransactionsTable } from '@/components/admin/pending-transactions-table';
import type { Transaction, UserData } from '@/lib/types';
import React, { useEffect, useState } from 'react';
import { toast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { useFirestore } from '@/firebase';
import { collectionGroup, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';

type TransactionWithUserDetails = Transaction & {
  userId: string;
  userEmail: string;
};

type PageData = {
    transactions: TransactionWithUserDetails[] | null;
    error?: string;
    indexCreationUrl?: string;
    indexStatusUrl?: string;
}

export default function AdminPendingTransactionsPage() {
  const [data, setData] = useState<PageData>({ transactions: null });
  const [loading, setLoading] = useState(true);
  const firestore = useFirestore();

  useEffect(() => {
    async function getPendingTransactions() {
      if (!firestore) {
          setLoading(true);
          return;
      };

      setLoading(true);
      try {
        const pendingTxsQuery = query(
          collectionGroup(firestore, 'transactions'), 
          where('status', '==', 'Pending')
        );

        const querySnapshot = await getDocs(pendingTxsQuery);
        
        const pendingTransactions = querySnapshot.docs.map(doc => {
            const data = doc.data() as Transaction;
            const pathParts = doc.ref.path.split('/');
            const userId = pathParts[1];
            return {
                ...data,
                id: doc.id,
                userId: userId,
                userEmail: 'Loading...',
            };
        });

        const transactionsWithUserDetails: TransactionWithUserDetails[] = await Promise.all(
          pendingTransactions.map(async (tx) => {
            const userRef = doc(firestore, 'users', tx.userId);
            const userSnap = await getDoc(userRef);
            const userEmail = userSnap.exists() ? (userSnap.data() as UserData).email : 'Unknown User';
            return { ...tx, userEmail };
          })
        );
        
        transactionsWithUserDetails.sort((a, b) => {
            const dateA = a.date ? new Date(a.date).getTime() : 0;
            const dateB = b.date ? new Date(b.date).getTime() : 0;
            return dateB - dateA;
        });

        setData({ transactions: transactionsWithUserDetails });

      } catch (error: any) {
        console.error("Error fetching pending transactions:", error);
        
        let pageData: PageData = { transactions: null, error: "Could not fetch pending transactions." };

        if (error.code === 'failed-precondition' && error.message.includes('index')) {
            const urlMatch = error.message.match(/https?:\/\/[^\s]+/);
            const url = urlMatch ? urlMatch[0] : null;

            if (error.message.includes('is not ready yet')) {
                 pageData = {
                    transactions: null,
                    error: "The required database index is still being built. This page will be available once the index is ready. This can take a few minutes.",
                    indexStatusUrl: url,
                };
            } else {
                 pageData = {
                    transactions: null,
                    error: "This query requires a Firestore index. To create it, please click the link below.",
                    indexCreationUrl: url,
                };
            }
        }
        
        setData(pageData);
        
        if (!pageData.indexCreationUrl && !pageData.indexStatusUrl) {
            toast({
                variant: "destructive",
                title: "Error Fetching Data",
                description: pageData.error,
            });
        }

      } finally {
        setLoading(false);
      }
    }

    if (firestore) {
        getPendingTransactions();
    }
  }, [firestore]);
  

  const renderErrorContent = () => {
    if (!data.error) return null;
    
    return (
        <Alert variant="destructive">
            <AlertTitle>Action Required</AlertTitle>
            <AlertDescription className="space-y-4">
                <p>{data.error}</p>
                {data.indexCreationUrl && (
                    <Button asChild>
                        <Link href={data.indexCreationUrl} target="_blank" rel="noopener noreferrer">
                            Create Index <ExternalLink className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                )}
                {data.indexStatusUrl && (
                    <Button asChild>
                        <Link href={data.indexStatusUrl} target="_blank" rel="noopener noreferrer">
                            Check Index Status <ExternalLink className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                )}
            </AlertDescription>
        </Alert>
    );
  };

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
          {loading && <Skeleton className="h-40 w-full" />}
          {data.error && renderErrorContent()}
          {!loading && !data.error && data.transactions && (
            <PendingTransactionsTable initialTransactions={data.transactions} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
