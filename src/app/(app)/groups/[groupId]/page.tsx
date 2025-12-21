
'use client';

import { useDoc, useFirestore } from '@/firebase';
import type { Group, UserData } from '@/lib/types';
import { doc, getDoc, collection, getDocs, query, where, documentId } from 'firebase/firestore';
import { useParams } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Users, Wallet, Calendar, ListOrdered, UserCheck } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getFirebase } from 'react-redux-firebase';

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

const getWeekNumber = (startDate: Date) => {
    const today = new Date();
    const diff = today.getTime() - startDate.getTime();
    if (diff < 0) return 1; // If group hasn't started, default to week 1
    return Math.floor(diff / (1000 * 60 * 60 * 24 * 7)) + 1;
};

export default function GroupDetailsPage() {
    const params = useParams();
    const groupId = params.groupId as string;
    const firestore = useFirestore();
    const [membersData, setMembersData] = useState<UserData[]>([]);
    const [loadingMembers, setLoadingMembers] = useState(true);

    const groupRef = React.useMemo(() => (firestore && groupId ? doc(firestore, 'groups', groupId) : null), [firestore, groupId]);
    const { data: group, loading: groupLoading } = useDoc<Group>(groupRef);

    useEffect(() => {
        if (group && group.members.length > 0 && firestore) {
            const fetchMembersData = async () => {
                setLoadingMembers(true);
                try {
                    const usersRef = collection(firestore, 'users');
                    const q = query(usersRef, where(documentId(), 'in', group.members));
                    const querySnapshot = await getDocs(q);
                    const users = querySnapshot.docs.map(d => ({ id: d.id, ...d.data() } as UserData));
                    setMembersData(users);
                } catch (error) {
                    console.error("Error fetching members' data: ", error);
                } finally {
                    setLoadingMembers(false);
                }
            };
            fetchMembersData();
        } else if (group && group.members.length === 0) {
            setLoadingMembers(false);
        }
    }, [group, firestore]);

    if (groupLoading || loadingMembers || !group) {
        return <PageSkeleton />;
    }

    const weeklyPurse = group.contributionAmount * group.members.length;
    const startDate = group.startedAt?.toDate();
    const currentWeek = startDate ? getWeekNumber(startDate) : null;
    const currentPayoutIndex = currentWeek ? (currentWeek - 1) % group.members.length : null;
    
    // Map member data for quick lookup
    const memberMap = new Map(membersData.map(m => [m.uid, m]));

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
            <Link href="/groups" className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-4 w-4" />
                Back to Groups
            </Link>
            <Card>
                <CardHeader>
                    <div className='flex justify-between items-start'>
                        <div>
                            <CardTitle>{group.name}</CardTitle>
                            <CardDescription>Details and activities for your savings group.</CardDescription>
                        </div>
                         <Badge variant={group.status === 'active' ? 'default' : 'secondary'} className="capitalize">{group.status}</Badge>
                    </div>
                </CardHeader>
                <CardContent className="space-y-8">
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                         <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">Weekly Group Purse</CardTitle>
                                <Wallet className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{formatCurrency(weeklyPurse)}</div>
                                <p className="text-xs text-muted-foreground">
                                    {formatCurrency(group.contributionAmount)} per member
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">Members</CardTitle>
                                <Users className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{group.members.length} / {group.numberOfMembers}</div>
                                <p className="text-xs text-muted-foreground">
                                    {group.numberOfMembers - group.members.length} slots remaining
                                </p>
                            </CardContent>
                        </Card>
                        {startDate && (
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-sm font-medium">Group Start Date</CardTitle>
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{startDate.toLocaleDateString()}</div>
                                    <p className="text-xs text-muted-foreground">
                                       Currently in Week {currentWeek}
                                    </p>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                    
                    {group.payoutOrder && group.payoutOrder.length > 0 && (
                         <div>
                            <h3 className="text-lg font-medium flex items-center gap-2 mb-4">
                                <ListOrdered />
                                Payout Order
                            </h3>
                             <div className="space-y-4">
                                {group.payoutOrder.map((memberId, index) => {
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
                </CardContent>
            </Card>
        </div>
    );
}
