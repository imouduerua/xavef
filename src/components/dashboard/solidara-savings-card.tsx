import { PiggyBank } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '../ui/button';
import { DepositDialog } from './deposit-dialog';

interface SolidaraSavingsCardProps {
  balance: number;
}

export function SolidaraSavingsCard({ balance }: SolidaraSavingsCardProps) {

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg md:text-xl">Savings (Olidara)</CardTitle>
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
        <CardDescription>Daily savings contributions</CardDescription>
      </CardContent>
      <CardFooter>
        <DepositDialog accountName="Savings (Olidara)" targetAccount="solidara">
            <Button className="w-full">Deposit</Button>
        </DepositDialog>
      </CardFooter>
    </Card>
  );
}
