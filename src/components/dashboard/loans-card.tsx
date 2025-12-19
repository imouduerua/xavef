import { CreditCard, Calendar, Percent, DollarSign } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { mockLoanAccount } from "@/lib/mock-data";

export function LoanCard() {
  const { balance, interestRate, nextPayment, nextPaymentDate } = mockLoanAccount;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>Loan Account</CardTitle>
            <CardDescription>Outstanding Balance</CardDescription>
          </div>
          <div className="rounded-md bg-primary p-2 text-primary-foreground">
            <CreditCard className="h-6 w-6" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-4xl font-bold tracking-tight">
          ${balance.toLocaleString()}
        </p>
        <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Percent className="h-4 w-4" />
            <span>Interest Rate: {interestRate}%</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>Next Due: {new Date(nextPaymentDate).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-2">
             <DollarSign className="h-4 w-4" />
             <span>Next Payment: ${nextPayment.toLocaleString()}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button className="w-full">Make a Payment</Button>
      </CardFooter>
    </Card>
  );
}
