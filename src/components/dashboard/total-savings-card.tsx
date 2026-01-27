import { Gem } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface TotalSavingsCardProps {
    balance: number;
}

export function TotalSavingsCard({ balance }: TotalSavingsCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg md:text-xl">Total Savings</CardTitle>
          </div>
          <div className="rounded-md bg-transparent text-muted-foreground">
            <Gem className="h-5 w-5" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold tracking-tight md:text-3xl">
          ₦{balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
        <CardDescription>Your combined savings across all accounts.</CardDescription>
      </CardContent>
    </Card>
  );
}
