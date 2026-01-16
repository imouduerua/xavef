
'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Users, Clock, Banknote, ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import { useFirestore } from '@/firebase';
import { collection, collectionGroup, query, where, type Query } from 'firebase/firestore';
import { useCollectionCount } from '@/firebase/firestore/use-collection-count';
import type { UserData, TransactionWithUserDetails } from '@/lib/types';


interface StatCardProps {
    value: number | null;
    icon: React.ElementType;
    title: string;
    href: string;
}

function StatCard({ value, icon: Icon, title, href }: StatCardProps) {
    return (
         <Link href={href}>
            <Card className="hover:bg-muted/50 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{title}</CardTitle>
                    <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{value ?? '...'}</div>
                </CardContent>
            </Card>
        </Link>
    )
}


export function StatsCards() {
    const firestore = useFirestore();
    const [usersQuery, setUsersQuery] = useState<Query<UserData> | null>(null);
    const [pendingQuery, setPendingQuery] = useState<Query<TransactionWithUserDetails> | null>(null);
    const [completedQuery, setCompletedQuery] = useState<Query<TransactionWithUserDetails> | null>(null);
    const [failedQuery, setFailedQuery] = useState<Query<TransactionWithUserDetails> | null>(null);

    useEffect(() => {
        if (firestore) {
            setUsersQuery(collection(firestore, 'users') as Query<UserData>);
            setPendingQuery(query(collectionGroup(firestore, 'transactions'), where('status', '==', 'Pending')) as Query<TransactionWithUserDetails>);
            setCompletedQuery(query(collectionGroup(firestore, 'transactions'), where('status', '==', 'Completed')) as Query<TransactionWithUserDetails>);
            setFailedQuery(query(collectionGroup(firestore, 'transactions'), where('status', '==', 'Failed')) as Query<TransactionWithUserDetails>);
        }
    }, [firestore]);


    const { count: usersCount } = useCollectionCount(usersQuery);
    const { count: pendingCount } = useCollectionCount(pendingQuery);
    const { count: completedCount } = useCollectionCount(completedQuery);
    const { count: failedCount } = useCollectionCount(failedQuery);

    const statCards: StatCardProps[] = [
        { value: usersCount, icon: Users, title: 'Total Users', href: '/admin/users' },
        { value: pendingCount, icon: Clock, title: 'Pending Transactions', href: '/admin/transactions?tab=pending' },
        { value: completedCount, icon: Banknote, title: 'Completed Transactions', href: '/admin/transactions?tab=completed' },
        { value: failedCount, icon: ShieldAlert, title: 'Failed Transactions', href: '/admin/transactions?tab=failed' },
    ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => (
            <StatCard key={index} {...stat} />
        ))}
    </div>
  );
}
