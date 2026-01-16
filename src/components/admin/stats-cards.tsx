
'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Users, Clock, Banknote, ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import { useFirestore } from '@/firebase';
import { collection, collectionGroup, getCountFromServer, query, where } from 'firebase/firestore';

interface Stat {
    value: number | null;
    icon: React.ElementType;
    title: string;
    href: string;
}

export function StatsCards() {
    const firestore = useFirestore();
    const [stats, setStats] = useState({
        users: null as number | null,
        pending: null as number | null,
        completed: null as number | null,
        failed: null as number | null,
    });

    useEffect(() => {
        if (!firestore) return;

        // Fetch users count
        const usersCol = collection(firestore, 'users');
        getCountFromServer(usersCol).then(snap => {
            setStats(s => ({ ...s, users: snap.data().count }));
        }).catch(err => {
            console.error("Error fetching user count:", err);
            setStats(s => ({ ...s, users: 0 }));
        });

        // Fetch transaction counts
        const transactionsColGroup = collectionGroup(firestore, 'transactions');
        
        const pendingQuery = query(transactionsColGroup, where('status', '==', 'Pending'));
        getCountFromServer(pendingQuery).then(snap => {
            setStats(s => ({ ...s, pending: snap.data().count }));
        }).catch(err => {
            console.error("Error fetching pending count:", err);
            setStats(s => ({ ...s, pending: 0 }));
        });
        
        const completedQuery = query(transactionsColGroup, where('status', '==', 'Completed'));
        getCountFromServer(completedQuery).then(snap => {
            setStats(s => ({ ...s, completed: snap.data().count }));
        }).catch(err => {
            console.error("Error fetching completed count:", err);
            setStats(s => ({ ...s, completed: 0 }));
        });

        const failedQuery = query(transactionsColGroup, where('status', '==', 'Failed'));
        getCountFromServer(failedQuery).then(snap => {
            setStats(s => ({ ...s, failed: snap.data().count }));
        }).catch(err => {
            console.error("Error fetching failed count:", err);
            setStats(s => ({ ...s, failed: 0 }));
        });

    }, [firestore]);


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
