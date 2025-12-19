import { PendingTransactions } from "@/components/admin/pending-transactions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Suspense } from "react";

export default function AdminPendingTransactionsPage() {
    return (
        <div className="grid gap-6">
            <Card>
                <CardHeader>
                    <CardTitle>Pending Transactions</CardTitle>
                    <CardDescription>Review and process all pending deposits and withdrawals.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Suspense fallback={<div>Loading pending transactions...</div>}>
                        <PendingTransactions />
                    </Suspense>
                </CardContent>
            </Card>
        </div>
    );
}
