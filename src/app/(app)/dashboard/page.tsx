'use client';

import { Copy } from 'lucide-react';
import Link from 'next/link';
import React from 'react';

import { AnnualSavingsCard } from '@/components/dashboard/annual-savings-card';
import { SolidaraSavingsCard } from '@/components/dashboard/solidara-savings-card';
import { TotalSavingsCard } from '@/components/dashboard/total-savings-card';
import { TransferDialog } from '@/components/dashboard/transfer-dialog';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { useDoc, useFirestore, useUser } from '@/firebase';
import { doc } from 'firebase/firestore';

export type AccountType = 'solidara' | 'annual';

export default function DashboardPage() {
  const { user } = useUser();
  const firestore = useFirestore();

  const userDocRef = React.useMemo(() => {
    if (!user) return null;
    return doc(firestore, 'users', user.uid);
  }, [user, firestore]);

  const { data: userData } = useDoc(userDocRef);


  const [balances, setBalances] = React.useState({
    solidara: 100000.0,
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


  const copyId = () => {
    if (!userData?.xavefId) return;
    navigator.clipboard.writeText(userData.xavefId);
    toast({
      title: 'Copied!',
      description: 'Your Xavef ID has been copied to your clipboard.',
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Your Xavef ID:</span>
          <span className="font-semibold">{userData?.xavefId}</span>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={copyId}>
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
      <div className="grid gap-6 md:grid-cols-3">
        <SolidaraSavingsCard balance={balances.solidara} />
        <AnnualSavingsCard balance={balances.annual} />
        <TotalSavingsCard balance={totalSavings} />
      </div>
      <div></div>
    </div>
  );
}
