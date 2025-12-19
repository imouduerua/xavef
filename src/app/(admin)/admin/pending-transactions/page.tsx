'use client';

import { PendingTransactions } from "@/components/admin/pending-transactions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminPendingTransactionsPage() {
    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Pending Transactions</CardTitle>
                    <CardDescription>Review all pending deposits and withdrawals before they are processed.</CardDescription>
                </CardHeader>
                <CardContent>
                    <PendingTransactions />
                </CardContent>
            </Card>
        </div>
    );
}
