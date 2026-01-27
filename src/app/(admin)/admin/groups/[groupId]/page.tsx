'use client';

import { useDoc, useCollection, useUser, useFirestore, useMemoFirebase } from '@/firebase';
import type { Group, Transaction, UserData } from '@/lib/types';
import { doc, collection, getDocs, query, where, documentId, collectionGroup, Timestamp, orderBy } from 'firebase/firestore';
import { useParams } from 'next/navigation';
import React, { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Users, Wallet, Calendar, ListOrdered, UserCheck, History } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MissingIndexAlert } from '@/components/admin/missing-index-alert';
import { GroupTransactionsTable } from '@/components/groups/group-transactions-table';


function PageSkeleton() {
    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
            <Skeleton className="h-6 w-32" />
            <Card>
                <CardHeader>
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-4 w-64" />
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <Skeleton className="h-24 w-full" />
                        <Skeleton className="h-24 w-full" />
                        <Skeleton className="h-24 w-full" />
                    </div>
                    <Separator />
                    <Skeleton className="h-48 w-full" />
                </CardContent>
            </Card>
        </div>
    );
}

const formatCurrency = (amount: number) =>
    `₦${amount.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;


export default function AdminGroupDetailsPage() {
    const params = useParams();
    const groupId = params.groupId as string;
    const firestore = useFirestore();
    const [membersData, setMembersData] = useState<UserData[]>([]);
    const [loadingMembers, setLoadingMembers] = useState(true);

    const groupRef = useMemoFirebase(() => firestore && groupId ? doc(firestore, 'groups', groupId) : null, [firestore, groupId]);
    const { data: group, loading: groupLoading } = useDoc<Group>(groupRef);
    
    const serializableGroup = useMemo(() => {
        if (!group) return null;
        return {
        ...group,
        startedAt: group.startedAt?.toDate(),
        lastDistributionDate: group.lastDistributionDate?.toDate(),
        };
    }, [group]);

    const [weekStart, weekEnd] = useMemo(() => {
        if (!serializableGroup?.startedAt) return [null, null];
        const startDate = serializableGroup.startedAt;
        const currentWeek = serializableGroup.currentCollectionWeek || 1;
        const weekOffset = (currentWeek - 1) * 7;
        
        const start = new Date(startDate);
        start.setDate(start.getDate() + weekOffset);
        start.setHours(0, 0, 0, 0);

        const end = new Date(start);
        end.setDate(end.getDate() + 7);
        end.setHours(0, 0, 0, 0);

        return [Timestamp.fromDate(start), Timestamp.fromDate(end)];
    }, [serializableGroup]);


    const weeklyContributionsQuery = useMemoFirebase(() => (firestore && serializableGroup && weekStart && weekEnd) ? query(
            collectionGroup(firestore, 'transactions'),
            where('groupId', '==', groupId),
            where('type', '==', 'Group Contribution'),
            where('date', '>=', weekStart),
            where('date', '<', weekEnd)
        ) : null, [firestore, serializableGroup, weekStart, weekEnd, groupId]);
    
    const groupTransactionsQuery = useMemoFirebase(() => (firestore && groupId) ? query(
            collectionGroup(firestore, 'transactions'),
            where('groupId', '==', groupId),
            orderBy('date', 'desc')
        ) : null, [firestore, groupId]);


    const { data: weeklyContributions, loading: contributionsLoading, indexCreationUrl } = useCollection<Transaction>(weeklyContributionsQuery);
    const { data: allGroupTransactions, loading: allTxsLoading, indexCreationUrl: allTxsIndexUrl } = useCollection<Transaction>(groupTransactionsQuery);
    
    const currentWeekDeposits = useMemo(() => {
        if (!weeklyContributions) return 0;
        return weeklyContributions.reduce((acc, tx) => acc + tx.amount, 0);
    }, [weeklyContributions]);


    useEffect(() => {
        const memberIds = serializableGroup?.members;
        if (!memberIds || memberIds.length === 0 || !firestore) {
            setLoadingMembers(false);
            return;
        }
        
        let isMounted = true;
        const fetchMembersData = async () => {
            setLoadingMembers(true);
            try {
                const usersRef = collection(firestore, 'users');
                const q = query(usersRef, where(documentId(), 'in', memberIds));
                const querySnapshot = await getDocs(q);
                if (isMounted) {
                    const users = querySnapshot.docs.map(d => ({ ...d.data(), uid: d.id } as UserData));
                    setMembersData(users);
                }
            } catch (error) {
                console.error("Error fetching members' data: ", error);
            } finally {
                if (isMounted) {
                    setLoadingMembers(false);
                }
            }
        };
        fetchMembersData();
        
        return () => {
            isMounted = false;
        };
    }, [serializableGroup?.members, firestore]);
    
    const isLoading = groupLoading || loadingMembers || contributionsLoading || allTxsLoading;

    if (isLoading) {
        return <PageSkeleton />;
    }
    
    if (!serializableGroup) {
        return (
            <div className="p-4 sm:p-6 lg:p-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Group Not Found</CardTitle>
                        <CardDescription>This group could not be loaded.</CardDescription>
                    </CardHeader>
                </Card>
            </div>
        )
    }

    const expectedWeeklyPurse = serializableGroup.contributionAmount * serializableGroup.members.length;

    const currentWeek = serializableGroup.currentCollectionWeek || 1;
    const currentPayoutIndex = serializableGroup.payoutOrder ? (currentWeek - 1) % serializableGroup.members.length : null;
    
    const memberMap = new Map(membersData.map(m => [m.uid, m]));

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
            <Link href="/admin/groups" className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-4 w-4" />
                Back to All Groups
            </Link>
            <Card>
                <CardHeader>
                    <div className='flex justify-between items-start'>
                        <div>
                            <CardTitle>{serializableGroup.name}</CardTitle>
                            <CardDescription>Administrator view of the savings group.</CardDescription>
                        </div>
                         <Badge variant={serializableGroup.status === 'active' ? 'default' : 'secondary'} className="capitalize">{serializableGroup.status}</Badge>
                    </div>
                </CardHeader>
                <CardContent className="space-y-8">
                     <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                         <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">This Week's Purse</CardTitle>
                                <Wallet className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                {indexCreationUrl ? (
                                    <MissingIndexAlert url={indexCreationUrl} />
                                ) : (
                                    <>
                                        <div className="text-2xl font-bold">{formatCurrency(currentWeekDeposits)}</div>
                                        <p className="text-xs text-muted-foreground">
                                            Goal: {formatCurrency(expectedWeeklyPurse)}
                                        </p>
                                    </>
                                )}
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">Members</CardTitle>
                                <Users className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{serializableGroup.members.length} / {serializableGroup.numberOfMembers}</div>
                                <p className="text-xs text-muted-foreground">
                                    {serializableGroup.numberOfMembers - serializableGroup.members.length} slots remaining
                                </p>
                            </CardContent>
                        </Card>
                        {serializableGroup.startedAt && (
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-sm font-medium">Current Week</CardTitle>
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">Week {currentWeek}</div>
                                    <p className="text-xs text-muted-foreground">
                                       Started on {serializableGroup.startedAt.toLocaleDateString()}
                                    </p>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                    
                    <Separator />

                    {serializableGroup.payoutOrder && serializableGroup.payoutOrder.length > 0 && (
                         <div>
                            <h3 className="text-lg font-medium flex items-center gap-2 mb-4">
                                <ListOrdered />
                                Payout Order
                            </h3>
                             <div className="space-y-4">
                                {serializableGroup.payoutOrder.map((memberId, index) => {
                                    const member = memberMap.get(memberId);
                                    const isCurrentPayout = index === currentPayoutIndex;
                                    return (
                                        <Card key={memberId} className={isCurrentPayout ? 'border-primary bg-primary/10' : ''}>
                                            <CardContent className="p-4 flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-lg font-bold text-muted-foreground w-6">{index + 1}.</span>
                                                    <Avatar className="h-9 w-9">
                                                        <AvatarImage src={undefined} alt={member?.displayName} />
                                                        <AvatarFallback>{member?.displayName?.charAt(0) || 'U'}</AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="font-semibold">{member?.displayName || 'Loading...'}</p>
                                                        <p className="text-xs text-muted-foreground">{member?.email}</p>
                                                    </div>
                                                </div>
                                                {isCurrentPayout && (
                                                    <Badge>
                                                        <UserCheck className="mr-2 h-4 w-4" />
                                                        This Week's Payout
                                                    </Badge>
                                                )}
                                            </CardContent>
                                        </Card>
                                    )
                                })}
                            </div>
                        </div>
                    )}
                    
                    <Separator />

                    <div>
                        <h3 className="text-lg font-medium flex items-center gap-2 mb-4">
                            <History />
                            Group Transaction History
                        </h3>
                        {allTxsIndexUrl ? (
                            <MissingIndexAlert url={allTxsIndexUrl} />
                        ) : (
                            <GroupTransactionsTable 
                                transactions={allGroupTransactions}
                                membersMap={memberMap}
                                loading={allTxsLoading}
                            />
                        )}
                    </div>

                </CardContent>
            </Card>
        </div>
    );
}
