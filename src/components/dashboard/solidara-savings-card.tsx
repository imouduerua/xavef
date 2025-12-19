import { PiggyBank } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '../ui/button';

export function SolidaraSavingsCard() {
  const balance = 100000.0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base font-medium">Savings (Olidara)</CardTitle>
          </div>
          <div className="rounded-md bg-transparent text-muted-foreground">
            <PiggyBank className="h-5 w-5" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold tracking-tight">
          ₦{balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
        <CardDescription>Daily savings contributions</CardDescription>
      </CardContent>
      <CardFooter>
        <Button className="w-full">Deposit</Button>
      </CardFooter>
    </Card>
  );
}
