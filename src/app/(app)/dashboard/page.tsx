
'use client';

import { Copy } from 'lucide-react';
import Link from 'next/link';
import React, { Suspense, useMemo } from 'react';

import { AnnualSavingsCard } from '@/components/dashboard/annual-savings-card';
import { SolidaraSavingsCard } from '@/components/dashboard/solidara-savings-card';
import { TotalSavingsCard } from '@/components/dashboard/total-savings-card';
import { TransferDialog } from '@/components/dashboard/transfer-dialog';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { useUserData } from '@/hooks/use-user-data';
import { useUser, useCollection, useFirestore } from '@/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ProfileInitializer } from '@/components/dashboard/profile-initializer';
import type { AccountType, Transaction } from '@/lib/types';
import { RecentTransactions } from '@/components/dashboard/recent-transactions';
import { collection, query, where } from 'firebase/firestore';

function DashboardContent() {
  const { user, loading: userLoading } = useUser();
  const { userData, loading: userDataLoading } = useUserData();
  const firestore = useFirestore();

  const pendingTransactionsQuery = useMemo(() => {
    if (!user) return null;
    return query(
      collection(firestore, "users", user.uid, "transactions"),
      where("status", "==", "Pending"),
      where("type", "==", "Deposit")
    );
  }, [user, firestore]);

  const { data: pendingTransactions, loading: pendingTransactionsLoading } = useCollection<Transaction>(pendingTransactionsQuery);

  const hasPendingSolidaraDeposit = useMemo(
    () => pendingTransactions?.some(tx => tx.targetAccount === 'solidara'),
    [pendingTransactions]
  );
  const hasPendingAnnualDeposit = useMemo(
    () => pendingTransactions?.some(tx => tx.targetAccount === 'annual'),
    [pendingTransactions]
  );
  
  const balances = {
    solidara: userData?.solidaraBalance ?? 0.0,
    annual: userData?.annualBalance ?? 0.0,
  };

  const totalSavings = balances.solidara + balances.annual;

  const handleSelfTransfer = (
    amount: number,
    from: AccountType,
    to: AccountType
  ) => {
     if (balances[from] < amount) {
        toast({
            variant: "destructive",
            title: "Transfer Failed",
            description: "Insufficient funds.",
        });
        return false;
    }
    
    toast({
        title: "Feature not implemented",
        description: "Self-transfers will be enabled soon.",
    });

    return true;
  };


  const copyToClipboard = (text: string, type: 'ID') => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied!',
      description: `Your Xavef ${type} has been copied to your clipboard.`,
    });
  };
  
  const PageSkeleton = () => (
     <div className="space-y-6">
            <Card>
                <CardHeader>
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-4 w-full" />
                </CardHeader>
            </Card>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
               <div className="flex items-center gap-4 text-sm">
                 <Skeleton className="h-6 w-48" />
                 <Skeleton className="h-6 w-8" />
               </div>
               <div className="flex items-center gap-2">
                 <Skeleton className="h-10 w-24" />
                 <Skeleton className="h-10 w-40" />
               </div>
            </div>
             <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <CardSkeleton />
                <CardSkeleton />
                <CardSkeleton />
            </div>
             <div className="mt-6">
                <Skeleton className="h-64 w-full" />
            </div>
        </div>
  )

  if (userLoading || userDataLoading || pendingTransactionsLoading) {
    return <PageSkeleton />
  }

  if (!userData) {
    return (
       <div className="space-y-6">
           <ProfileInitializer />
           <PageSkeleton />
        </div>
    )
  }


  return (
    <div className="space-y-6">
      <ProfileInitializer />
       <Card>
            <CardHeader>
                <CardTitle>Welcome, {userData?.firstName || userData?.displayName || 'User'}</CardTitle>
                <CardDescription>
                    Here is a summary of your accounts and recent activity.
                </CardDescription>
            </CardHeader>
        </Card>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Your Xavef ID:</span>
          <span className="font-semibold">{userData?.xavefId}</span>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyToClipboard(userData?.xavefId ?? '', 'ID')}>
            <Copy size={14} />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <TransferDialog balances={balances} onSelfTransfer={handleSelfTransfer} />
          <Button asChild>
            <Link href="/transactions">Transaction History</Link>
          </Button>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <SolidaraSavingsCard balance={balances.solidara} disabled={hasPendingSolidaraDeposit} />
        <AnnualSavingsCard balance={balances.annual} disabled={hasPendingAnnualDeposit} />
        <TotalSavingsCard balance={totalSavings} />
      </div>
      <div>
        <RecentTransactions />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <Suspense fallback={<div>Loading...</div>}>
        <DashboardContent />
      </Suspense>
    </div>
  );
}

function CardSkeleton() {
    return (
        <Card className="flex flex-col justify-between p-6">
            <div className="space-y-4">
                <div className="flex items-start justify-between">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-5 w-5" />
                </div>
                <Skeleton className="h-8 w-40" />
                <Skeleton className="h-4 w-48" />
            </div>
            <Skeleton className="h-10 w-full mt-6" />
        </Card>
    )
}
