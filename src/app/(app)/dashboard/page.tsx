import { SavingsCard } from "@/components/dashboard/savings-card";
import { LoanCard } from "@/components/dashboard/loans-card";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";

export default function DashboardPage() {
  return (
    <div className="space-y-8">
        <div className="grid gap-6 md:grid-cols-2">
            <SavingsCard />
            <LoanCard />
        </div>
        <div>
            <RecentTransactions />
        </div>
    </div>
  );
}
