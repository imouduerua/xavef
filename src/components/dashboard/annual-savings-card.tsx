
import { Calendar } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function AnnualSavingsCard() {
  const balance = 5300.00;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-xl">Annual Savings</CardTitle>
            <CardDescription>Total saved this year</CardDescription>
          </div>
          <div className="rounded-md bg-primary p-2 text-primary-foreground">
            <Calendar className="h-6 w-6" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-5xl font-bold tracking-tight">
          ${balance.toLocaleString()}
        </p>
      </CardContent>
    </Card>
  );
}
