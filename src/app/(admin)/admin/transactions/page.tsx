
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AllTransactionsTable } from "@/components/admin/all-transactions-table";
import { Suspense } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AdminTransactionsPage() {
    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>All Transactions</CardTitle>
                    <CardDescription>
                        View and manage all transactions across the platform.
                    </CardDescription>
                </CardHeader>
            </Card>
            <Suspense fallback={<div>Loading transactions...</div>}>
                <AllTransactionsTable />
            </Suspense>
        </div>
    );
}
