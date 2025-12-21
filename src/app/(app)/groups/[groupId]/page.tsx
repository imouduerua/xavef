
'use client';

import { useCollection, useDoc, useFirestore, useUser } from '@/firebase';
import type { Group, Transaction, UserData } from '@/lib/types';
import { doc, getDoc, collection, getDocs, query, where, documentId, collectionGroup, Timestamp } from 'firebase/firestore';
import { useParams } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Users, Wallet, Calendar, ListOrdered, UserCheck, HandCoins } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { distributeGroupFunds } from '../client-actions';
import { toast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { MissingIndexAlert } from '@/components/admin/missing-index-alert';
import { DepositDialog } from '@/components/dashboard/deposit-dialog';


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


export default function GroupDetailsPage() {
    const params = useParams();
    const groupId = params.groupId as string;
    const firestore = useFirestore();
    const { user } = useUser();
    const [membersData, setMembersData] = useState<UserData[]>([]);
    const [loadingMembers, setLoadingMembers] = useState(true);

    const groupRef = React.useMemo(() => (firestore && groupId ? doc(firestore, 'groups', groupId) : null), [firestore, groupId]);
    const { data: group, loading: groupLoading } = useDoc<Group>(groupRef);
    
    // Determine the start and end of the current collection week
    const [weekStart, weekEnd] = React.useMemo(() => {
        if (!group?.startedAt) return [null, null];
        const startDate = group.startedAt.toDate();
        const currentWeek = group.currentCollectionWeek || 1;
        const weekOffset = (currentWeek - 1) * 7;
        
        const start = new Date(startDate);
        start.setDate(start.getDate() + weekOffset);
        start.setHours(0, 0, 0, 0);

        const end = new Date(start);
        end.setDate(end.getDate() + 7);
        end.setHours(0, 0, 0, 0);

        return [Timestamp.fromDate(start), Timestamp.fromDate(end)];
    }, [group]);


    const weeklyContributionsQuery = React.useMemo(() => {
        if (!firestore || !group || group.members.length === 0 || !weekStart || !weekEnd) return null;
        return query(
            collectionGroup(firestore, 'transactions'),
            where('groupId', '==', groupId),
            where('type', '==', 'Group Contribution'),
            where('date', '>=', weekStart),
            where('date', '<', weekEnd)
        );
    }, [firestore, groupId, group, weekStart, weekEnd]);

    const { data: weeklyContributions, loading: contributionsLoading, indexCreationUrl } = useCollection<Transaction>(weeklyContributionsQuery);
    
    const currentWeekDeposits = React.useMemo(() => {
        if (!weeklyContributions) return 0;
        return weeklyContributions.reduce((acc, tx) => acc + tx.amount, 0);
    }, [weeklyContributions]);


    useEffect(() => {
        if (group && group.members.length > 0 && firestore) {
            const fetchMembersData = async () => {
                setLoadingMembers(true);
                try {
                    const usersRef = collection(firestore, 'users');
                    // Firestore 'in' queries are limited to 10 elements. If groups can be larger, this needs pagination.
                    const q = query(usersRef, where(documentId(), 'in', group.members.slice(0, 10)));
                    const querySnapshot = await getDocs(q);
                    const users = querySnapshot.docs.map(d => ({ ...d.data(), uid: d.id } as UserData));
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

    if (groupLoading || loadingMembers || contributionsLoading || !group) {
        return <PageSkeleton />;
    }

    const expectedWeeklyPurse = group.contributionAmount * group.members.length;
    const isPurseComplete = currentWeekDeposits >= expectedWeeklyPurse;
    const isGroupCreator = user?.uid === group.creatorUid;
    const isUserMember = user ? group.members.includes(user.uid) : false;

    const currentWeek = group.currentCollectionWeek || 1;
    const currentPayoutIndex = group.payoutOrder ? (currentWeek - 1) % group.members.length : null;
    const currentRecipientUid = currentPayoutIndex !== null && group.payoutOrder ? group.payoutOrder[currentPayoutIndex] : null;

    const handleDistribute = async () => {
        if (!firestore || !currentRecipientUid) {
            toast({ variant: 'destructive', title: "Error", description: "Cannot determine recipient." });
            return;
        }
        const result = await distributeGroupFunds(firestore, groupId, currentRecipientUid, currentWeekDeposits);
        if (result.success) {
            toast({ title: "Funds Distributed!", description: "The weekly purse has been sent to the recipient." });
        } else {
            toast({ variant: 'destructive', title: "Distribution Failed", description: result.error });
        }
    };
    
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
                                <div className="text-2xl font-bold">{group.members.length} / {group.numberOfMembers}</div>
                                <p className="text-xs text-muted-foreground">
                                    {group.numberOfMembers - group.members.length} slots remaining
                                </p>
                            </CardContent>
                        </Card>
                        {group.startedAt && (
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-sm font-medium">Current Week</CardTitle>
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">Week {currentWeek}</div>
                                    <p className="text-xs text-muted-foreground">
                                       Started on {group.startedAt.toDate().toLocaleDateString()}
                                    </p>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                    
                    <div className="flex justify-end gap-2">
                        {isUserMember && group.status === 'active' && (
                            <DepositDialog
                                accountName={group.name}
                                targetAccount="group"
                                groupId={group.id}
                                contributionAmount={group.contributionAmount}
                            >
                                <Button>
                                    <HandCoins className="mr-2 h-4 w-4" />
                                    Contribute to Group
                                </Button>
                            </DepositDialog>
                        )}
                        {isGroupCreator && group.status === 'active' && (
                             <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button disabled={!isPurseComplete} variant="secondary">
                                        <HandCoins className="mr-2 h-4 w-4" />
                                        Distribute Purse
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Confirm Distribution</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This will transfer {formatCurrency(currentWeekDeposits)} to {memberMap.get(currentRecipientUid!)?.displayName || 'the recipient'} and advance the group to the next week. This action cannot be undone.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleDistribute}>
                                            Yes, Distribute
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
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
