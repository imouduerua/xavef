
'use client';

import { PiggyBank, Clock, Banknote } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '../ui/button';
import { DepositDialog } from './deposit-dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';


interface OlidaraSavingsCardProps {
  balance: number;
  pendingAmount?: number;
}

export function OlidaraSavingsCard({ balance, pendingAmount }: OlidaraSavingsCardProps) {
  const isDisabled = pendingAmount !== undefined;

  const depositButton = (
     <DepositDialog accountName="Olidara Savings" targetAccount="olidara">
        <Button className="w-full" disabled={isDisabled}>
           <Banknote className="mr-2" />
           Deposit
        </Button>
    </DepositDialog>
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg md:text-xl">Olidara Savings</CardTitle>
          </div>
          <div className="rounded-md bg-transparent text-muted-foreground">
            <PiggyBank className="h-5 w-5" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold tracking-tight md:text-3xl">
          ₦{balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
        {isDisabled ? (
           <div className="flex items-center text-sm text-yellow-600 mt-2">
                <Clock className="h-4 w-4 mr-2" />
                <span>Pending contribution: ₦{pendingAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
        ) : (
             <CardDescription>Your flexible savings account.</CardDescription>
        )}
      </CardContent>
      <CardFooter>
        {isDisabled ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                 <div className="w-full">{depositButton}</div>
              </TooltipTrigger>
              <TooltipContent>
                <p>You have a pending contribution for this account.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          depositButton
        )}
      </CardFooter>
    </Card>
  );
}
