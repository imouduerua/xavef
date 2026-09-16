'use client';

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AllTransactionsTable } from "@/components/admin/all-transactions-table";
import { Suspense } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSearchParams } from "next/navigation";

export default function AdminTransactionsPage() {
    const searchParams = useSearchParams();
    const tab = searchParams.get('tab') || 'all';

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
            <Tabs defaultValue={tab} className="space-y-4">
                <TabsList>
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="pending">Pending</TabsTrigger>
                    <TabsTrigger value="completed">Completed</TabsTrigger>
                    <TabsTrigger value="failed">Failed</TabsTrigger>
                </TabsList>
                <TabsContent value="all">
                    <Suspense fallback={<div>Loading transactions...</div>}>
                        <AllTransactionsTable />
                    </Suspense>
                </TabsContent>
                <TabsContent value="pending">
                    <Suspense fallback={<div>Loading transactions...</div>}>
                        <AllTransactionsTable status="Pending" />
                    </Suspense>
                </TabsContent>
                <TabsContent value="completed">
                    <Suspense fallback={<div>Loading transactions...</div>}>
                        <AllTransactionsTable status="Completed" />
                    </Suspense>
                </TabsContent>
                <TabsContent value="failed">
                    <Suspense fallback={<div>Loading transactions...</div>}>
                        <AllTransactionsTable status="Failed" />
                    </Suspense>
                </TabsContent>
            </Tabs>
        </div>
    );
}
