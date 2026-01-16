'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Users, Clock, Banknote, ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import { Skeleton } from '../ui/skeleton';
import { useFirestore } from '@/firebase';
import { collection, collectionGroup, getCountFromServer, query, where } from 'firebase/firestore';

interface Stat {
    value: number | null;
    icon: React.ElementType;
    title: string;
    href: string;
}

function StatsCardsSkeleton() {
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
}

export function StatsCards() {
    const firestore = useFirestore();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        users: null,
        pending: null,
        completed: null,
        failed: null,
    });

    useEffect(() => {
        if (!firestore) return;

        const fetchCounts = async () => {
            try {
                setLoading(true);
                const usersCol = collection(firestore, 'users');
                const transactionsColGroup = collectionGroup(firestore, 'transactions');

                const pendingQuery = query(transactionsColGroup, where('status', '==', 'Pending'));
                const completedQuery = query(transactionsColGroup, where('status', '==', 'Completed'));
                const failedQuery = query(transactionsColGroup, where('status', '==', 'Failed'));

                const [
                    usersSnap,
                    pendingSnap,
                    completedSnap,
                    failedSnap
                ] = await Promise.all([
                    getCountFromServer(usersCol),
                    getCountFromServer(pendingQuery),
                    getCountFromServer(completedQuery),
                    getCountFromServer(failedQuery)
                ]);

                setStats({
                    users: usersSnap.data().count,
                    pending: pendingSnap.data().count,
                    completed: completedSnap.data().count,
                    failed: failedSnap.data().count,
                });

            } catch (error) {
                console.error("Error fetching admin stats:", error);
                setStats({ users: 0, pending: 0, completed: 0, failed: 0 }); // Show 0 on error
            } finally {
                setLoading(false);
            }
        };

        fetchCounts();
    }, [firestore]);

    const statCards: Stat[] = [
        { value: stats.users, icon: Users, title: 'Total Users', href: '/admin/users' },
        { value: stats.pending, icon: Clock, title: 'Pending Transactions', href: '/admin/transactions?tab=pending' },
        { value: stats.completed, icon: Banknote, title: 'Completed Transactions', href: '/admin/transactions?tab=completed' },
        { value: stats.failed, icon: ShieldAlert, title: 'Failed Transactions', href: '/admin/transactions?tab=failed' },
    ];

    if (loading) {
        return <StatsCardsSkeleton />;
    }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => (
            <Link href={stat.href} key={index}>
                <Card className="hover:bg-muted/50 transition-colors">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                        <stat.icon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stat.value ?? '...'}</div>
                    </CardContent>
                </Card>
            </Link>
        ))}
    </div>
  );
}

StatsCards.Skeleton = StatsCardsSkeleton;
