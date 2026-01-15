
import { StatsCards } from "@/components/admin/stats-cards";
import { Suspense } from "react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RecentTransactions } from "@/components/admin/recent-transactions";
import { PendingWithdrawals } from "@/components/admin/pending-withdrawals";

export default function AdminDashboardPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Administrator Dashboard</CardTitle>
          <CardDescription>
            Oversee user activity, manage transactions, and monitor the platform.
          </CardDescription>
        </CardHeader>
      </Card>

      <Suspense fallback={<StatsCards.Skeleton />}>
        <StatsCards />
      </Suspense>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Suspense fallback={<PendingWithdrawals.Skeleton />}>
            <PendingWithdrawals />
        </Suspense>
        <Suspense fallback={<RecentTransactions.Skeleton />}>
            <RecentTransactions />
        </Suspense>
      </div>
    </div>
  );
}
