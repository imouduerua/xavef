'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Users, Clock, Banknote, ShieldAlert, Shield, PiggyBank, Calendar, Landmark, Target } from 'lucide-react';
import Link from 'next/link';
import { useFirestore, useCollectionCount, useMemoFirebase, useCollection } from '@/firebase';
import { collection, collectionGroup, query, where, type Query } from 'firebase/firestore';
import type { UserData, TransactionWithUserDetails, SavingGoal } from '@/lib/types';


interface StatCardProps {
    value: number | null;
    icon: React.ElementType;
    title: string;
    href?: string;
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
    
    const cardContent = (
        <Card className="hover:bg-muted/50 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{formattedValue()}</div>
            </CardContent>
        </Card>
    );

    return href ? <Link href={href}>{cardContent}</Link> : cardContent;
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

    const goalsQuery = useMemoFirebase(() => 
        firestore ? (collectionGroup(firestore, 'goals') as Query<SavingGoal>) : null,
    [firestore]);

    const { data: usersData, loading: usersLoading } = useCollection<UserData>(usersQuery);
    const { count: pendingCount } = useCollectionCount(pendingQuery);
    const { count: completedCount } = useCollectionCount(completedQuery);
    const { count: failedCount } = useCollectionCount(failedQuery);
    const { data: goalsData, loading: goalsLoading } = useCollection<SavingGoal>(goalsQuery);

    const usersCount = usersData?.length ?? null;
    const totalPoolBalance = usersData?.reduce((acc, user) => acc + (user.groupPoolBalance || 0), 0) ?? null;
    const totalOlidaraBalance = usersData?.reduce((acc, user) => acc + (user.olidaraBalance || 0), 0) ?? null;
    const totalAnnualBalance = usersData?.reduce((acc, user) => acc + (user.annualBalance || 0), 0) ?? null;
    const totalGoalsBalance = goalsData?.reduce((acc, goal) => acc + (goal.currentAmount || 0), 0) ?? null;

    const totalInCustody = (totalOlidaraBalance !== null && totalAnnualBalance !== null && totalPoolBalance !== null && totalGoalsBalance !== null)
        ? totalOlidaraBalance + totalAnnualBalance + totalPoolBalance + totalGoalsBalance
        : null;

    const statCards: StatCardProps[] = [
        { value: usersCount, icon: Users, title: 'Total Users', href: '/admin/users' },
        { value: totalInCustody, icon: Landmark, title: 'Total in Custody', formatAsCurrency: true },
        { value: totalOlidaraBalance, icon: PiggyBank, title: 'Total Olidara Savings', href: '/admin/users', formatAsCurrency: true },
        { value: totalAnnualBalance, icon: Calendar, title: 'Total Annual Savings', href: '/admin/users', formatAsCurrency: true },
        { value: totalPoolBalance, icon: Shield, title: 'Total Pool Savings', href: '/admin/pool', formatAsCurrency: true },
        { value: totalGoalsBalance, icon: Target, title: 'Total in Goals', formatAsCurrency: true },
        { value: pendingCount, icon: Clock, title: 'Pending Transactions', href: '/admin/transactions?tab=pending' },
        { value: completedCount, icon: Banknote, title: 'Completed Transactions', href: '/admin/transactions?tab=completed' },
        { value: failedCount, icon: ShieldAlert, title: 'Failed Transactions', href: '/admin/transactions?tab=failed' },
    ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {statCards.map((stat, index) => (
             <StatCard key={index} {...stat} />
        ))}
    </div>
  );
}
