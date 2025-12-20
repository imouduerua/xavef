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
import type { Transaction, TransactionStatus } from "@/lib/types";
import { useUser, useCollection, useFirestore } from "@/firebase";
import { collection, query, orderBy } from "firebase/firestore";
import React, { useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const statusVariant: Record<TransactionStatus, "default" | "secondary" | "destructive"> = {
  Completed: "default",
  Pending: "secondary",
  Failed: "destructive",
};

function MissingIndexAlert({ url }: { url: string }) {
    return (
        <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Database Index Required</AlertTitle>
            <AlertDescription>
                <p className="mb-4">
                    To display and sort transactions efficiently, a database index is needed.
                    Please click the button below to create the index in the Firebase console.
                    It may take a few minutes to build.
                </p>
                <Button asChild>
                    <a href={url} target="_blank" rel="noopener noreferrer">
                        Create Database Index
                    </a>
                </Button>
            </AlertDescription>
        </Alert>
    )
}

const formatDate = (date: any) => {
    if (!date) return 'N/A';
    if (date.toDate) {
        return date.toDate().toLocaleDateString();
    }
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'Invalid Date';
    return d.toLocaleDateString();
};

function TransactionsTable({ transactions, isLoading, indexCreationUrl }: { transactions: Transaction[] | null, isLoading: boolean, indexCreationUrl?: string | null }) {
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

  if (indexCreationUrl) {
      return <MissingIndexAlert url={indexCreationUrl} />;
  }

  if (!transactions || transactions.length === 0) {
    return (
        <Card>
            <CardContent className="pt-6">
                <p>No transactions found for this category.</p>
            </CardContent>
        </Card>
    )
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
            {transactions.map((tx) => {
              const amount = Number(tx.amount);
              return (
                <TableRow key={tx.id}>
                  <TableCell className="font-medium">{tx.description}</TableCell>
                  <TableCell>{tx.type}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[tx.status]}>{tx.status}</Badge>
                  </TableCell>
                  <TableCell>{formatDate(tx.date)}</TableCell>
                  <TableCell className={`text-right font-semibold ${amount > 0 ? 'text-green-600' : ''}`}>
                    {amount > 0 ? `+₦${amount.toFixed(2)}` : `-₦${Math.abs(amount).toFixed(2)}`}
                  </TableCell>
                </TableRow>
              )
            })}
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

  const { data: transactions, loading, indexCreationUrl } = useCollection<Transaction>(transactionsQuery);

  // The query now handles sorting, so client-side sorting is not strictly necessary
  // but we keep it as a good practice in case the query changes.
  const sortedTransactions = useMemo(() => {
    if (!transactions) return [];
    return [...transactions];
  }, [transactions]);


  const all = sortedTransactions ?? [];
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
          <TransactionsTable transactions={all} isLoading={loading} indexCreationUrl={indexCreationUrl} />
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
