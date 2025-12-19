
import { PiggyBank } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function SolidaraSavingsCard() {
  const balance = 1250.75;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-xl">Solidara Savings</CardTitle>
            <CardDescription>Mutual fund contribution</CardDescription>
          </div>
          <div className="rounded-md bg-primary p-2 text-primary-foreground">
            <PiggyBank className="h-6 w-6" />
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
