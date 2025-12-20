import { Calendar } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '../ui/button';
import { DepositDialog } from './deposit-dialog';

interface AnnualSavingsCardProps {
    balance: number;
}

export function AnnualSavingsCard({ balance }: AnnualSavingsCardProps) {

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg md:text-xl">Annual Savings</CardTitle>
          </div>
          <div className="rounded-md bg-transparent text-muted-foreground">
            <Calendar className="h-5 w-5" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="mt-auto">
        <p className="text-2xl font-bold tracking-tight md:text-3xl">
          ₦{balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
        <CardDescription>End of year savings goal</CardDescription>
      </CardContent>
      <CardFooter>
         <DepositDialog accountName="Annual Savings" targetAccount="annual">
            <Button className="w-full">Deposit</Button>
        </DepositDialog>
      </CardFooter>
    </Card>
  );
}
