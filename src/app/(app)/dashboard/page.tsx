'use client';

import { Copy } from 'lucide-react';
import Link from 'next/link';

import { AnnualSavingsCard } from '@/components/dashboard/annual-savings-card';
import { SolidaraSavingsCard } from '@/components/dashboard/solidara-savings-card';
import { TotalSavingsCard } from '@/components/dashboard/total-savings-card';
import { TransferDialog } from '@/components/dashboard/transfer-dialog';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';

export default function DashboardPage() {
  const copyId = () => {
    navigator.clipboard.writeText('1234');
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
          <span className="font-semibold">1234</span>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={copyId}>
            <Copy size={14} />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <TransferDialog />
          <Button asChild>
            <Link href="/transactions">Transaction History</Link>
          </Button>
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        <SolidaraSavingsCard />
        <AnnualSavingsCard />
        <TotalSavingsCard />
      </div>
      <div></div>
    </div>
  );
}
