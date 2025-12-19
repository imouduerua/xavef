import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { mockTransactions } from "@/lib/mock-data";
import type { Transaction, TransactionStatus, TransactionType } from "@/lib/types";

const statusVariant: Record<TransactionStatus, "default" | "secondary" | "destructive"> = {
  Completed: "default",
  Pending: "secondary",
  Failed: "destructive",
};

function TransactionsTable({ transactions }: { transactions: Transaction[] }) {
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
                  {tx.amount > 0 ? `+$${tx.amount.toFixed(2)}` : `-$${Math.abs(tx.amount).toFixed(2)}`}
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
  const all = mockTransactions;
  const deposits = mockTransactions.filter((tx) => tx.type === "Deposit" || tx.type === "Interest");
  const withdrawals = mockTransactions.filter((tx) => tx.type === "Withdrawal");
  const payments = mockTransactions.filter((tx) => tx.type === "Loan Payment");

  return (
    <Tabs defaultValue="all">
      <TabsList>
        <TabsTrigger value="all">All</TabsTrigger>
        <TabsTrigger value="deposits">Deposits</TabsTrigger>
        <TabsTrigger value="withdrawals">Withdrawals</TabsTrigger>
        <TabsTrigger value="payments">Payments</TabsTrigger>
      </TabsList>
      <TabsContent value="all">
        <TransactionsTable transactions={all} />
      </TabsContent>
      <TabsContent value="deposits">
        <TransactionsTable transactions={deposits} />
      </TabsContent>
      <TabsContent value="withdrawals">
        <TransactionsTable transactions={withdrawals} />
      </TabsContent>
      <TabsContent value="payments">
        <TransactionsTable transactions={payments} />
      </TabsContent>
    </Tabs>
  );
}
