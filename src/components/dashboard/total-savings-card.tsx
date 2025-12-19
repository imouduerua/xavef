
import { Gem } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function TotalSavingsCard() {
    const balance = 25100.25;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>Total Savings</CardTitle>
            <CardDescription>Across all accounts</CardDescription>
          </div>
          <div className="rounded-md bg-primary p-2 text-primary-foreground">
            <Gem className="h-6 w-6" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-4xl font-bold tracking-tight">
          ${balance.toLocaleString()}
        </p>
      </CardContent>
    </Card>
  );
}
