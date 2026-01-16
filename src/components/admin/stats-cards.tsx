'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Users, Clock, Banknote, ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import { useFirestore, useUser } from '@/firebase';
import { collection, collectionGroup, getCountFromServer, query, where } from 'firebase/firestore';

interface Stat {
    value: number | null;
    icon: React.ElementType;
    title: string;
    href: string;
}

export function StatsCards() {
    const { user, loading: authLoading } = useUser();
    const firestore = useFirestore();
    const [stats, setStats] = useState({
        users: null as number | null,
        pending: null as number | null,
        completed: null as number | null,
        failed: null as number | null,
    });

    useEffect(() => {
        if (authLoading || !user || !firestore) return;

        const fetchStats = async () => {
            try {
                // Fetch users count
                const usersCol = collection(firestore, 'users');
                const usersSnap = await getCountFromServer(usersCol);
                setStats(s => ({ ...s, users: usersSnap.data().count }));

                // Fetch transaction counts
                const transactionsColGroup = collectionGroup(firestore, 'transactions');
                
                const pendingQuery = query(transactionsColGroup, where('status', '==', 'Pending'));
                const pendingSnap = await getCountFromServer(pendingQuery);
                setStats(s => ({ ...s, pending: pendingSnap.data().count }));
                
                const completedQuery = query(transactionsColGroup, where('status', '==', 'Completed'));
                const completedSnap = await getCountFromServer(completedQuery);
                setStats(s => ({ ...s, completed: completedSnap.data().count }));

                const failedQuery = query(transactionsColGroup, where('status', '==', 'Failed'));
                const failedSnap = await getCountFromServer(failedQuery);
                setStats(s => ({ ...s, failed: failedSnap.data().count }));
            } catch (error) {
                console.error("Error fetching stats:", error);
                // Set to 0 on error to avoid infinite loading
                setStats({ users: 0, pending: 0, completed: 0, failed: 0 });
            }
        };
        
        fetchStats();

    }, [firestore, user, authLoading]);


    const statCards: Stat[] = [
        { value: stats.users, icon: Users, title: 'Total Users', href: '/admin/users' },
        { value: stats.pending, icon: Clock, title: 'Pending Transactions', href: '/admin/transactions?tab=pending' },
        { value: stats.completed, icon: Banknote, title: 'Completed Transactions', href: '/admin/transactions?tab=completed' },
        { value: stats.failed, icon: ShieldAlert, title: 'Failed Transactions', href: '/admin/transactions?tab=failed' },
    ];

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
