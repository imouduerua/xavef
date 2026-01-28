
'use client';

import { Copy, Users } from 'lucide-react';
import Link from 'next/link';
import React, { Suspense, useMemo, useCallback, useState, useEffect } from 'react';

import { AnnualSavingsCard } from '@/components/dashboard/annual-savings-card';
import { SolidaraSavingsCard } from '@/components/dashboard/solidara-savings-card';
import { TotalSavingsCard } from '@/components/dashboard/total-savings-card';
import { TransferDialog } from '@/components/dashboard/transfer-dialog';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { useCollection, useDoc, useUser, useFirestore, useMemoFirebase } from '@/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { AccountType, SavingGoal, Transaction, GroupJoinRequest, UserData } from '@/lib/types';
import { RecentTransactions } from '@/components/dashboard/recent-transactions';
import { collection, query, where, orderBy, doc, updateDoc } from 'firebase/firestore';
import { addFundsToGoal, createSavingGoal } from '@/app/(app)/savings/client-actions';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { transferToAnnual } from '@/app/(app)/dashboard/actions';
import { GroupPoolSavingsCard } from '@/components/dashboard/group-pool-savings-card';

function DashboardApp() {
  const { user, loading: authLoading } = useUser();
  const firestore = useFirestore();
  const [creatingGoals, setCreatingGoals] = useState(false);

  const userDocRef = useMemoFirebase(() => firestore && user?.uid ? doc(firestore, 'users', user.uid) : null, [firestore, user?.uid]);
  const { data: userData, loading: userDataLoading } = useDoc<UserData>(userDocRef);

  const pendingTransactionsQuery = useMemoFirebase(() => firestore && user?.uid ? query(
      collection(firestore, "users", user.uid, "transactions"),
      where("status", "==", "Pending"),
    ) : null, [firestore, user?.uid]);
  
  const goalsQuery = useMemoFirebase(() => firestore && user?.uid ? query(collection(firestore, `users/${user.uid}/goals`), orderBy('createdAt', 'desc')) : null, [firestore, user?.uid]);

  const joinRequestsQuery = useMemoFirebase(() => firestore && user?.uid ? query(
      collection(firestore, 'joinRequests'),
      where('groupCreatorUid', '==', user.uid),
      where('status', '==', 'pending')
    ) : null, [firestore, user?.uid]);


  const { data: pendingTransactions } = useCollection<Transaction>(pendingTransactionsQuery);
  const { data: goals, loading: goalsLoading } = useCollection<SavingGoal>(goalsQuery);
  const { data: joinRequests } = useCollection<GroupJoinRequest>(joinRequestsQuery);

  useEffect(() => {
    const createDefaultGoals = async () => {
        if (authLoading || userDataLoading || !user || !userData || !firestore || userData.goalsInitialized || creatingGoals) {
            return;
        }

        setCreatingGoals(true);
        try {
            await Promise.all([
                createSavingGoal(firestore, user.uid, {
                    name: "House Rent",
                    targetAmount: 1200000,
                    emoji: '🏠'
                }),
                createSavingGoal(firestore, user.uid, {
                    name: "School Fees",
                    targetAmount: 800000,
                    emoji: '🎓'
                })
            ]);

            const userRef = doc(firestore, 'users', user.uid);
            await updateDoc(userRef, { goalsInitialized: true });

            toast({
                title: "Welcome!",
                description: "We've created a couple of example saving goals for you to get started."
            });

        } catch (error) {
            console.error("Failed to create default saving goals:", error);
        } finally {
            setCreatingGoals(false);
        }
    };

    createDefaultGoals();
  }, [authLoading, userDataLoading, user, userData, firestore, creatingGoals]);


  const pendingSolidaraDeposit = useMemo(
    () => pendingTransactions?.find(tx => tx.targetAccount === 'solidara' && tx.type === 'Deposit'),
    [pendingTransactions]
  );
  const pendingAnnualDeposit = useMemo(
    () => pendingTransactions?.find(tx => tx.targetAccount === 'annual' && tx.type === 'Deposit'),
    [pendingTransactions]
  );
    const pendingGroupPoolDeposit = useMemo(
    () => pendingTransactions?.find(tx => tx.targetAccount === 'groupPool' && tx.type === 'Deposit'),
    [pendingTransactions]
  );
  
  const balances = {
    solidara: userData?.solidaraBalance ?? 0.0,
    annual: userData?.annualBalance ?? 0.0,
    groupPool: userData?.groupPoolBalance ?? 0.0,
  };

  const totalSavings = balances.solidara + balances.annual + balances.groupPool;

  const handleSelfTransfer = useCallback(async (
    amount: number,
    from: AccountType,
    to: string
  ) => {
     if (!user?.uid || !firestore) return false;

     if (balances[from] < amount) {
        toast({
            variant: "destructive",
            title: "Transfer Failed",
            description: "Insufficient funds.",
        });
        return false;
    }
    
    // from solidara
    if (from === 'solidara') {
      if (to === 'annual') {
          const result = await transferToAnnual(firestore, user.uid, amount);
          if (result.success) {
              toast({
                  title: "Transfer Successful!",
                  description: `You transferred ₦${amount.toFixed(2)} to your Annual Savings.`
              });
              return true;
          } else {
              toast({ variant: "destructive", title: "Transfer Failed", description: result.error });
              return false;
          }
      } else { // to goal
          const result = await addFundsToGoal(firestore, user.uid, to, amount);
          if (result.success) {
              const goalName = goals?.find(g => g.id === to)?.name || 'your goal';
              toast({
                  title: "Transfer Successful!",
                  description: `You transferred ₦${amount.toFixed(2)} to "${goalName}".`
              });
              return true;
          } else {
              toast({ variant: "destructive", title: "Transfer Failed", description: result.error });
              return false;
          }
      }
    } 

    return false;

  }, [user?.uid, balances, goals, firestore]);


  const copyToClipboard = (text: string, type: 'ID') => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied!',
      description: `Your Xavef ${type} has been copied to your clipboard.`,
    });
  };

  if (authLoading || userDataLoading) {
    return <PageSkeleton />;
  }

  if (!userData) {
    return (
         <div className="p-4 sm:p-6 lg:p-8 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Error Loading Profile</CardTitle>
                    <CardDescription>
                       Your user profile could not be found. Please try logging out and back in. If the problem persists, contact support.
                    </CardDescription>
                </CardHeader>
            </Card>
        </div>
    );
  }
  
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
       <Card>
            <CardHeader>
                <CardTitle>Welcome, {userData.firstName || userData.displayName || 'User'}</CardTitle>
                <CardDescription>
                    Here is a summary of your accounts and recent activity.
                </CardDescription>
            </CardHeader>
        </Card>

        {joinRequests && joinRequests.length > 0 && (
            <Alert variant="default" className="border-primary/50">
                <Users className="h-4 w-4" />
                <AlertTitle className="font-bold">New Group Join Requests</AlertTitle>
                <AlertDescription>
                    You have {joinRequests.length} new request{joinRequests.length > 1 ? 's' : ''} to join your groups.
                    <Button asChild variant="link" className="p-0 pl-2 h-auto">
                        <Link href="/groups">Manage Requests</Link>
                    </Button>
                </AlertDescription>
            </Alert>
        )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Your Xavef ID:</span>
          <span className="font-semibold">{userData.xavefId}</span>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyToClipboard(userData.xavefId ?? '', 'ID')}>
            <Copy size={14} />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <TransferDialog balances={balances} goals={goals || []} onSelfTransfer={handleSelfTransfer} />
          <Button asChild>
            <Link href="/transactions">Transaction History</Link>
          </Button>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <SolidaraSavingsCard balance={balances.solidara} pendingAmount={pendingSolidaraDeposit?.amount} />
        <AnnualSavingsCard balance={balances.annual} pendingAmount={pendingAnnualDeposit?.amount} />
        <GroupPoolSavingsCard balance={balances.groupPool} pendingAmount={pendingGroupPoolDeposit?.amount} />
        <TotalSavingsCard balance={totalSavings} />
      </div>
      <div>
        <RecentTransactions />
      </div>
    </div>
  );
}


function PageSkeleton() {
    return (
     <div className="p-4 sm:p-6 lg:p-8 space-y-6">
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
             <div className="grid gap-4 sm:grid-cols-2">
                <CardSkeleton />
                <CardSkeleton />
                <CardSkeleton />
                <CardSkeleton />
            </div>
             <div className="mt-6">
                <Skeleton className="h-64 w-full" />
            </div>
        </div>
  )
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

export default function DashboardPage() {
    return (
      <Suspense fallback={<PageSkeleton />}>
        <DashboardApp />
      </Suspense>
    );
  }

    
