
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { PendingTransactionsTable } from '@/components/admin/pending-transactions-table';

export default function PendingTransactionsPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Pending Transactions</CardTitle>
          <CardDescription>
            Approve or decline pending deposits and withdrawals from all users.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <PendingTransactionsTable />
        </CardContent>
      </Card>
    </div>
  );
}
