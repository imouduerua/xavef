import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { getPendingTransactionsAction } from './actions';
import { PendingTransactionsTable } from '@/components/admin/pending-transactions-table';

export default async function AdminPendingTransactionsPage() {
  const { transactions, error } = await getPendingTransactionsAction();

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Pending Transactions</CardTitle>
          <CardDescription>
            Review all pending deposits and withdrawals before they are
            processed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && <p className="text-destructive">{error}</p>}
          {transactions && (
            <PendingTransactionsTable initialTransactions={transactions} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
