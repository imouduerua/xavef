
'use client';

import { Shield, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface GroupPoolSavingsCardProps {
    balance: number;
    pendingAmount?: number;
}

export function GroupPoolSavingsCard({ balance, pendingAmount }: GroupPoolSavingsCardProps) {
  const isDisabled = pendingAmount !== undefined;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg md:text-xl">Xavef Pool Savings</CardTitle>
          </div>
          <div className="rounded-md bg-transparent text-muted-foreground">
            <Shield className="h-5 w-5" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="mt-auto">
        <p className="text-2xl font-bold tracking-tight md:text-3xl">
          ₦{balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
         {isDisabled ? (
           <div className="flex items-center text-sm text-yellow-600 mt-2">
                <Clock className="h-4 w-4 mr-2" />
                <span>Pending deposit: ₦{pendingAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
        ) : (
            <CardDescription>Your contributions to the official loan & savings pool.</CardDescription>
        )}
      </CardContent>
    </Card>
  );
}
