'use client';

import { Copy } from 'lucide-react';
import Link from 'next/link';
import React, { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

import { AnnualSavingsCard } from '@/components/dashboard/annual-savings-card';
import { SolidaraSavingsCard } from '@/components/dashboard/solidara-savings-card';
import { TotalSavingsCard } from '@/components/dashboard/total-savings-card';
import { TransferDialog } from '@/components/dashboard/transfer-dialog';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { useUserData } from '@/hooks/use-user-data';
import { useUser } from '@/firebase';
import { createUserProfile } from './actions';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';

export type AccountType = 'solidara' | 'annual';

function DashboardContent() {
  const { user, loading: userLoading } = useUser();
  const { userData, loading: userDataLoading } = useUserData();
  const [isCreatingProfile, setIsCreatingProfile] = React.useState(true);
  const searchParams = useSearchParams();
  const referralCode = searchParams.get('referralCode');

  useEffect(() => {
    const handleProfileCreation = async () => {
        if (user && !userDataLoading && !userData) {
            setIsCreatingProfile(true);
            toast({
              title: "Finalizing Account Setup",
              description: "Please wait while we create your user profile...",
            });
            const result = await createUserProfile(user.uid, user.email!, user.displayName!, referralCode);
            if (!result.success) {
                toast({
                    variant: "destructive",
                    title: "Profile Creation Failed",
                    description: result.error || "Could not save your profile. Please contact support.",
                });
            } else {
                 toast({
                    title: "Account Ready!",
                    description: "Your profile has been created successfully.",
                });
            }
            setIsCreatingProfile(false);
        } else if (user && userData) {
           setIsCreatingProfile(false);
        }
    };

    handleProfileCreation();
  }, [user, userData, userDataLoading, referralCode]);


  const [balances, setBalances] = React.useState({
    solidara: 0.0,
    annual: 0.0,
  });

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

    setBalances((prevBalances) => ({
      ...prevBalances,
      [from]: prevBalances[from] - amount,
      [to]: prevBalances[to] + amount,
    }));

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
  
  if (userLoading || userDataLoading || isCreatingProfile) {
    return (
        <div className="space-y-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
               <div className="flex items-center gap-4 text-sm">
                 <Skeleton className="h-6 w-48" />
                 <Skeleton className="h-6 w-8" />
               </div>
               <div className="flex items-center gap-2">
                 <Skeleton className="h-10 w-24" />
                 <Skeleton className="h-10 w-40" />
               </div>
            </div>
             <div className="grid gap-6 md:grid-cols-3">
                <CardSkeleton />
                <CardSkeleton />
                <CardSkeleton />
            </div>
        </div>
    )
  }


  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Your Xavef ID:</span>
            <span className="font-semibold">{userData?.xavefId}</span>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyToClipboard(userData?.xavefId ?? '', 'ID')}>
              <Copy size={14} />
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <TransferDialog balances={balances} onSelfTransfer={handleSelfTransfer} />
          <Button asChild>
            <Link href="/transactions">Transaction History</Link>
          </Button>
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        <SolidaraSavingsCard balance={balances.solidara} />
        <AnnualSavingsCard balance={balances.annual} />
        <TotalSavingsCard balance={totalSavings} />
      </div>
      <div></div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DashboardContent />
    </Suspense>
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
