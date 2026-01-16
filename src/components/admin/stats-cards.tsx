'use client';

import React from 'react';
import { useFirestore } from '@/firebase';
import { collection, collectionGroup, getCountFromServer, query, where } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '../ui/skeleton';
import { Users, Clock, Banknote, ShieldAlert } from 'lucide-react';
import Link from 'next/link';

async function fetchStats(db: any) {
  const usersCol = collection(db, 'users');
  const transactionsColGroup = collectionGroup(db, 'transactions');

  const totalUsersQuery = query(usersCol);
  const pendingTxsQuery = query(transactionsColGroup, where('status', '==', 'Pending'));
  const completedTxsQuery = query(transactionsColGroup, where('status', '==', 'Completed'));
  const failedTxsQuery = query(transactionsColGroup, where('status', '==', 'Failed'));

  const [
    totalUsersSnap,
    pendingTxsSnap,
    completedTxsSnap,
    failedTxsSnap,
  ] = await Promise.all([
    getCountFromServer(totalUsersQuery),
    getCountFromServer(pendingTxsQuery),
    getCountFromServer(completedTxsQuery),
    getCountFromServer(failedTxsQuery),
  ]);

  return {
    totalUsers: totalUsersSnap.data().count,
    pendingTransactions: pendingTxsSnap.data().count,
    completedTransactions: completedTxsSnap.data().count,
    failedTransactions: failedTxsSnap.data().count,
  };
}

export function StatsCards() {
  const firestore = useFirestore();
  const [stats, setStats] = React.useState<{ totalUsers: number; pendingTransactions: number, completedTransactions: number; failedTransactions: number } | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (firestore) {
      fetchStats(firestore)
        .then(setStats)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [firestore]);

  if (loading || !stats) {
    return <StatsCards.Skeleton />;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Link href="/admin/users">
        <Card className="hover:bg-muted/50 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            </CardContent>
        </Card>
      </Link>
      <Link href="/admin/transactions?tab=pending">
        <Card className="hover:bg-muted/50 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Transactions</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
            <div className="text-2xl font-bold">{stats.pendingTransactions}</div>
            </CardContent>
        </Card>
      </Link>
       <Link href="/admin/transactions?tab=completed">
        <Card className="hover:bg-muted/50 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Transactions</CardTitle>
            <Banknote className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
            <div className="text-2xl font-bold">{stats.completedTransactions}</div>
            </CardContent>
        </Card>
       </Link>
      <Link href="/admin/transactions?tab=failed">
        <Card className="hover:bg-muted/50 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed Transactions</CardTitle>
            <ShieldAlert className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
            <div className="text-2xl font-bold">{stats.failedTransactions}</div>
            </CardContent>
        </Card>
      </Link>
    </div>
  );
}

StatsCards.Skeleton = function SkeletonComponent() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-16" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pending Transactions</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-16" />
        </CardContent>
      </Card>
       <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Completed Transactions</CardTitle>
          <Banknote className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
           <Skeleton className="h-8 w-16" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Failed Transactions</CardTitle>
          <ShieldAlert className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
            <Skeleton className="h-8 w-16" />
        </CardContent>
      </Card>
    </div>
  );
};
