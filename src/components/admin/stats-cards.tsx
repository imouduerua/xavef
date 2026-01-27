
'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Users, Clock, Banknote, ShieldAlert, Shield } from 'lucide-react';
import Link from 'next/link';
import { useFirestore, useCollectionCount, useMemoFirebase, useCollection } from '@/firebase';
import { collection, collectionGroup, query, where, type Query } from 'firebase/firestore';
import type { UserData, TransactionWithUserDetails } from '@/lib/types';


interface StatCardProps {
    value: number | null;
    icon: React.ElementType;
    title: string;
    href: string;
    formatAsCurrency?: boolean;
}

function StatCard({ value, icon: Icon, title, href, formatAsCurrency = false }: StatCardProps) {
    const formattedValue = () => {
        if (value === null) return '...';
        if (formatAsCurrency) {
             return `₦${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        }
        return value;
    }
    
    return (
         <Link href={href}>
            <Card className="hover:bg-muted/50 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{title}</CardTitle>
                    <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{formattedValue()}</div>
                </CardContent>
            </Card>
        </Link>
    )
}


export function StatsCards() {
    const firestore = useFirestore();

    const usersQuery = useMemoFirebase(() => 
        firestore ? (collection(firestore, 'users') as Query<UserData>) : null,
    [firestore]);

    const pendingQuery = useMemoFirebase(() => 
        firestore ? (query(collectionGroup(firestore, 'transactions'), where('status', '==', 'Pending')) as Query<TransactionWithUserDetails>) : null,
    [firestore]);

    const completedQuery = useMemoFirebase(() => 
        firestore ? (query(collectionGroup(firestore, 'transactions'), where('status', '==', 'Completed')) as Query<TransactionWithUserDetails>) : null,
    [firestore]);

    const failedQuery = useMemoFirebase(() => 
        firestore ? (query(collectionGroup(firestore, 'transactions'), where('status', '==', 'Failed')) as Query<TransactionWithUserDetails>) : null,
    [firestore]);

    const { data: usersData, loading: usersLoading } = useCollection<UserData>(usersQuery);
    const { count: pendingCount } = useCollectionCount(pendingQuery);
    const { count: completedCount } = useCollectionCount(completedQuery);
    const { count: failedCount } = useCollectionCount(failedQuery);

    const usersCount = usersData?.length ?? null;
    const totalPoolBalance = usersData?.reduce((acc, user) => acc + (user.groupPoolBalance || 0), 0) ?? null;

    const statCards: StatCardProps[] = [
        { value: usersCount, icon: Users, title: 'Total Users', href: '/admin/users' },
        { value: totalPoolBalance, icon: Shield, title: 'Total Pool Savings', href: '/admin/pool', formatAsCurrency: true },
        { value: pendingCount, icon: Clock, title: 'Pending Transactions', href: '/admin/transactions?tab=pending' },
        { value: completedCount, icon: Banknote, title: 'Completed Transactions', href: '/admin/transactions?tab=completed' },
        { value: failedCount, icon: ShieldAlert, title: 'Failed Transactions', href: '/admin/transactions?tab=failed' },
    ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => {
            if (index === 1) { // Insert an empty div to push the pool balance to the next row for better layout
                return <React.Fragment key="spacer"></React.Fragment>
            }
            if (index === 2) {
                return (
                     <div key="pool-card-wrapper" className="grid gap-4 md:col-span-2 lg:grid-cols-2">
                          <StatCard {...statCards[1]} />
                          <StatCard {...stat} />
                     </div>
                )
            }
             if (index > 2) {
                 return <StatCard key={index} {...stat} />
             }
            return <StatCard key={index} {...stat} />
        })}
    </div>
  );
}
