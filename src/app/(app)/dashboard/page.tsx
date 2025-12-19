
import { SolidaraSavingsCard } from "@/components/dashboard/solidara-savings-card";
import { AnnualSavingsCard } from "@/components/dashboard/annual-savings-card";
import { TotalSavingsCard } from "@/components/dashboard/total-savings-card";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";

export default function DashboardPage() {
  return (
    <div className="space-y-8">
        <div className="grid gap-6 md:grid-cols-3">
            <SolidaraSavingsCard />
            <AnnualSavingsCard />
            <TotalSavingsCard />
        </div>
        <div>
            <RecentTransactions />
        </div>
    </div>
  );
}
