import { Landmark, ArrowDown, ArrowUp } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { mockSavingsAccount } from "@/lib/mock-data";

export function SavingsCard() {
  const { balance, apy, interestEarned } = mockSavingsAccount;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>Savings Account</CardTitle>
            <CardDescription>Available Balance</CardDescription>
          </div>
          <div className="rounded-md bg-primary p-2 text-primary-foreground">
            <Landmark className="h-6 w-6" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-4xl font-bold tracking-tight">
          ₦{balance.toLocaleString()}
        </p>
        <div className="flex space-x-4 text-sm text-muted-foreground">
          <span>APY: {apy}%</span>
          <span>Interest Earned: ₦{interestEarned.toLocaleString()}</span>
        </div>
      </CardContent>
      <CardFooter>
        <div className="flex w-full gap-2">
          <Button className="flex-1">
            <ArrowDown className="mr-2 h-4 w-4" /> Deposit
          </Button>
          <Button variant="secondary" className="flex-1">
            <ArrowUp className="mr-2 h-4 w-4" /> Withdraw
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
