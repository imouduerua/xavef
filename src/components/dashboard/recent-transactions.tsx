import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { mockTransactions } from "@/lib/mock-data";
import type { TransactionStatus } from "@/lib/types";
import { Button } from "../ui/button";
import { ArrowUpRight } from "lucide-react";

const statusVariant: Record<TransactionStatus, "default" | "secondary" | "destructive"> = {
    "Completed": "default",
    "Pending": "secondary",
    "Failed": "destructive"
}


export function RecentTransactions() {
  const recentTransactions = mockTransactions.slice(0, 5);

  return (
    <Card>
        <CardHeader className="flex flex-row items-center">
            <div className="grid gap-2">
                 <CardTitle>Recent Transactions</CardTitle>
                 <CardDescription>A summary of your latest account activity.</CardDescription>
            </div>
            <Button asChild size="sm" className="ml-auto gap-1">
                <Link href="/transactions">
                    View All
                    <ArrowUpRight className="h-4 w-4" />
                </Link>
            </Button>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Description</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {recentTransactions.map((tx) => (
                    <TableRow key={tx.id}>
                        <TableCell className="font-medium">{tx.description}</TableCell>
                        <TableCell>{tx.type}</TableCell>
                        <TableCell>
                            <Badge variant={statusVariant[tx.status]}>{tx.status}</Badge>
                        </TableCell>
                        <TableCell>{new Date(tx.date).toLocaleDateString()}</TableCell>
                        <TableCell className={`text-right font-semibold ${tx.amount > 0 ? 'text-green-600' : ''}`}>
                            {tx.amount > 0 ? `+₦${tx.amount.toFixed(2)}` : `-₦${Math.abs(tx.amount).toFixed(2)}`}
                        </TableCell>
                    </TableRow>
                    ))}
                </TableBody>
            </Table>
      </CardContent>
    </Card>
  );
}
