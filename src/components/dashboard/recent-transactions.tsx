
'use client';

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
import type { Transaction, TransactionStatus } from "@/lib/types";
import { Button } from "../ui/button";
import { ArrowUpRight } from "lucide-react";
import { useCollection, useFirestore, useUser } from "@/firebase";
import { useMemo } from "react";
import { collection, limit, orderBy, query } from "firebase/firestore";
import { Skeleton } from "../ui/skeleton";

const statusVariant: Record<TransactionStatus, "default" | "secondary" | "destructive"> = {
    "Completed": "default",
    "Pending": "secondary",
    "Failed": "destructive"
}


export function RecentTransactions() {
  const { user } = useUser();
  const firestore = useFirestore();

  const transactionsQuery = useMemo(() => {
    if (!user) return null;
    return query(
      collection(firestore, "users", user.uid, "transactions"),
      orderBy("date", "desc"),
      limit(5)
    );
  }, [user, firestore]);

  const { data: transactions, loading } = useCollection<Transaction>(transactionsQuery);

  if (loading) {
      return (
          <Card>
              <CardHeader>
                  <CardTitle>Recent Transactions</CardTitle>
                  <CardDescription>A summary of your latest account activity.</CardDescription>
              </CardHeader>
              <CardContent>
                  <div className="space-y-2">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
              </CardContent>
          </Card>
      )
  }

  if (!transactions || transactions.length === 0) {
      return (
           <Card>
                <CardHeader>
                    <CardTitle>Recent Transactions</CardTitle>
                    <CardDescription>A summary of your latest account activity.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p>No transactions found.</p>
                </CardContent>
            </Card>
      )
  }

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
                    {transactions.map((tx) => (
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
