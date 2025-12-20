
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
import { collection, limit, query, where } from "firebase/firestore";
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
    // Removed orderBy to prevent index error. Sorting is now done on the client.
    return query(
      collection(firestore, "users", user.uid, "transactions"),
      where("status", "in", ["Completed", "Failed"]),
      limit(5)
    );
  }, [user, firestore]);

  const { data: transactions, loading } = useCollection<Transaction>(transactionsQuery);

  // Sort transactions on the client-side
  const sortedTransactions = useMemo(() => {
    if (!transactions) return [];
    return [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions]);


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

  if (!sortedTransactions || sortedTransactions.length === 0) {
      return (
           <Card>
                <CardHeader>
                    <CardTitle>Recent Transactions</CardTitle>
                    <CardDescription>A summary of your latest account activity.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p>No recent transactions found.</p>
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
                        <TableHead className="hidden sm:table-cell">Type</TableHead>
                        <TableHead className="hidden md:table-cell">Status</TableHead>
                        <TableHead className="hidden lg:table-cell">Date</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {sortedTransactions.map((tx) => (
                    <TableRow key={tx.id}>
                        <TableCell className="font-medium">{tx.description}</TableCell>
                        <TableCell className="hidden sm:table-cell">{tx.type}</TableCell>
                        <TableCell className="hidden md:table-cell">
                            <Badge variant={statusVariant[tx.status]}>{tx.status}</Badge>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">{new Date(tx.date).toLocaleDateString()}</TableCell>
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
