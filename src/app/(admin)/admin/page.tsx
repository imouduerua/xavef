
'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useFirestore } from '@/firebase/provider';
import type { Group, Transaction, UserData } from '@/lib/types';
import { collection, collectionGroup, query, where } from 'firebase/firestore';
import {
  Users,
  Clock,
  PiggyBank,
  ArrowDownCircle,
  ArrowUpCircle,
  Activity,
} from 'lucide-react';
import Link from 'next/link';
import React, { useMemo } from 'react';

const formatCurrency = (amount: number) => {
  if (isNaN(amount)) {
    return '₦0.00';
  }
  return `₦${amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  link,
}: {
  title: string;
  value: string;
  description: string;
  icon: React.ElementType;
  link?: string;
}) {
    const cardContent = (
         <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <Icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{value}</div>
            <p className="text-xs text-muted-foreground">{description}</p>
          </CardContent>
        </Card>
    );

    if (link) {
        return <Link href={link}>{cardContent}</Link>;
    }

    return cardContent;
}

export default function AdminDashboardPage() {
  const firestore = useFirestore();
  const usersQuery = useMemo(() => query(collection(firestore, 'users')), [firestore]);
  const groupsQuery = useMemo(() => query(collection(firestore, 'groups'), where('status', '==', 'active')), [firestore]);
  const transactionsQuery = useMemo(() => query(collectionGroup(firestore, 'transactions'), where('status', '==', 'Completed')), [firestore]);
  const pendingTxsQuery = useMemo(() => query(collectionGroup(firestore, 'transactions'), where('status', '==', 'Pending')), [firestore]);


  const { data: users, loading: usersLoading } = useCollection<UserData>(usersQuery);
  const { data: activeGroups, loading: groupsLoading } = useCollection<Group>(groupsQuery);
  const { data: transactions, loading: txsLoading } = useCollection<Transaction>(transactionsQuery);
  const { data: pendingTxs, loading: pendingTxsLoading } = useCollection<Transaction>(pendingTxsQuery);

  const stats = useMemo(() => {
    const totalUsers = users?.length ?? 0;
    const totalActiveGroups = activeGroups?.length ?? 0;
    const pendingTransactions = pendingTxs?.length ?? 0;

    const totalSavings =
      users?.reduce(
        (acc, user) => acc + (user.solidaraBalance || 0) + (user.annualBalance || 0),
        0
      ) ?? 0;

    const totalDeposits =
      transactions
        ?.filter((tx) => tx.type === 'Deposit')
        .reduce((acc, tx) => acc + tx.amount, 0) ?? 0;

    const totalWithdrawals =
      transactions
        ?.filter((tx) => tx.type === 'Withdrawal')
        .reduce((acc, tx) => acc + tx.amount, 0) ?? 0;

    return {
      totalUsers,
      totalActiveGroups,
      totalSavings,
      totalDeposits,
      totalWithdrawals: Math.abs(totalWithdrawals),
      pendingTransactions,
    };
  }, [users, activeGroups, transactions, pendingTxs]);

  const isLoading = usersLoading || groupsLoading || txsLoading || pendingTxsLoading;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Admin Dashboard</CardTitle>
          <CardDescription>
            Welcome to the XAVEF Financials control panel. Here is an overview
            of platform activity.
          </CardDescription>
        </CardHeader>
      </Card>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
            title="Total Users"
            value={isLoading ? '...' : stats.totalUsers.toString()}
            description="Total registered users on the platform."
            icon={Users}
        />
         <StatCard
            title="Total Savings"
            value={isLoading ? '...' : formatCurrency(stats.totalSavings)}
            description="Combined Olidara & Annual balances."
            icon={PiggyBank}
        />
        <StatCard
            title="Total Deposits"
            value={isLoading ? '...' : formatCurrency(stats.totalDeposits)}
            description="Sum of all completed deposits."
            icon={ArrowDownCircle}
        />
         <StatCard
            title="Total Withdrawals"
            value={isLoading ? '...' : formatCurrency(stats.totalWithdrawals)}
            description="Sum of all completed withdrawals."
            icon={ArrowUpCircle}
        />
        <StatCard
            title="Active Groups"
            value={isLoading ? '...' : stats.totalActiveGroups.toString()}
            description="Number of currently active savings groups."
            icon={Activity}
            link="/admin/groups"
        />
        <StatCard
            title="Pending Transactions"
            value={isLoading ? '...' : stats.pendingTransactions.toString()}
            description="Deposits and withdrawals to be reviewed."
            icon={Clock}
            link="/admin/pending-transactions"
        />
      </div>
       <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">User Management</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">Oversee Users</div>
                <p className="text-xs text-muted-foreground">
                    View all registered users and their transaction histories.
                </p>
            </CardContent>
            <CardFooter>
                 <Button asChild className="w-full">
                    <Link href="/admin/users">Go to User Management</Link>
                </Button>
            </CardFooter>
        </Card>
    </div>
  );
}
