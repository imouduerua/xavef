"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Transaction, TransactionStatus, TransactionType } from "@/lib/types";
import { useUser, useCollection, useFirestore } from "@/firebase";
import { collection, query, where, orderBy } from "firebase/firestore";
import { useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";

const statusVariant: Record<TransactionStatus, "default" | "secondary" | "destructive"> = {
  Completed: "default",
  Pending: "secondary",
  Failed: "destructive",
};

function TransactionsTable({ transactions, isLoading }: { transactions: Transaction[], isLoading: boolean }) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }
  return (
    <Card>
      <CardContent className="pt-6">
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

export default function TransactionsPage() {
  const { user } = useUser();
  const firestore = useFirestore();

  const transactionsQuery = useMemo(() => {
    if (!user) return null;
    return query(
      collection(firestore, "users", user.uid, "transactions"),
      orderBy("date", "desc")
    );
  }, [user, firestore]);

  const { data: transactions, loading } = useCollection<Transaction>(transactionsQuery);

  const all = transactions || [];
  const deposits = all.filter((tx) => tx.type === "Deposit" || tx.type === "Interest");
  const withdrawals = all.filter((tx) => tx.type === "Withdrawal");
  const payments = all.filter((tx) => tx.type === "Loan Payment");

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
       <Card>
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
            <CardDescription>View all your account activity.</CardDescription>
          </CardHeader>
       </Card>
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="deposits">Deposits</TabsTrigger>
          <TabsTrigger value="withdrawals">Withdrawals</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
        </TabsList>
        <TabsContent value="all">
          <TransactionsTable transactions={all} isLoading={loading} />
        </TabsContent>
        <TabsContent value="deposits">
          <TransactionsTable transactions={deposits} isLoading={loading} />
        </TabsContent>
        <TabsContent value="withdrawals">
          <TransactionsTable transactions={withdrawals} isLoading={loading} />
        </TabsContent>
        <TabsContent value="payments">
          <TransactionsTable transactions={payments} isLoading={loading} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
