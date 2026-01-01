
'use client';

import { useCollection, useFirestore, useUser, useDoc } from '@/firebase';
import type { Group, Transaction, UserData } from '@/lib/types';
import {
  doc,
  collection,
  Timestamp,
  orderBy,
  query,
  where,
  getDocs,
  documentId,
  collectionGroup,
} from 'firebase/firestore';
import { useParams } from 'next/navigation';
import React, { useEffect, useState, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ArrowLeft,
  Users,
  Wallet,
  Calendar,
  ListOrdered,
  UserCheck,
  History,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from '@/hooks/use-toast';
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

function GroupMembers({
  memberIds,
  payoutOrder,
  currentPayoutIndex,
}: {
  memberIds: string[];
  payoutOrder: string[];
  currentPayoutIndex: number | null;
}) {
  const firestore = useFirestore();
  const [members, setMembers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!firestore || memberIds.length === 0) {
      setLoading(false);
      return;
    }
    let isMounted = true;
    const fetchMembersData = async () => {
      setLoading(true);
      try {
        const usersRef = collection(firestore, 'users');
        // Note: Firestore 'in' queries are limited to 30 items. 
        // For larger groups, you would need to chunk this request.
        const q = query(usersRef, where(documentId(), 'in', memberIds));
        const querySnapshot = await getDocs(q);
        
        if (isMounted) {
            const users = querySnapshot.docs.map(
              (d) => ({ ...d.data(), uid: d.id } as UserData)
            );
            
            // Create a map for quick lookups
            const userMap = new Map(users.map(u => [u.uid, u]));
            
            // Sort the members array according to the payoutOrder
            const sortedUsers = payoutOrder.map(uid => userMap.get(uid)).filter(Boolean) as UserData[];
            
            setMembers(sortedUsers);
        }

      } catch (error) {
        console.error("Error fetching members' data: ", error);
        if (isMounted) {
            toast({ variant: 'destructive', title: 'Error', description: "Could not load group members." });
        }
      } finally {
        if (isMounted) {
            setLoading(false);
        }
      }
    };

    fetchMembersData();

    return () => { isMounted = false; };
  }, [firestore, memberIds, payoutOrder]);
  
  if (loading) {
     return <Skeleton className="h-48 w-full" />;
  }

  return (
    <div className="space-y-4">
      {members.map((member, index) => {
        const isCurrentPayout = index === currentPayoutIndex;
        return (
          <Card
            key={member.uid}
            className={isCurrentPayout ? 'border-primary bg-primary/10' : ''}
          >
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-lg font-bold text-muted-foreground w-6">
                  {index + 1}.
                </span>
                <Avatar className="h-9 w-9">
                  <AvatarImage src={undefined} alt={member?.displayName} />
                  <AvatarFallback>
                    {member?.displayName?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{member?.displayName}</p>
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
        );
      })}
    </div>
  );
}


export default function GroupDetailsPage() {
  const params = useParams();
  const groupId = params.groupId as string;
  const firestore = useFirestore();
  const { user } = useUser();

  const groupRef = useMemo(
    () => (firestore && groupId ? doc(firestore, 'groups', groupId) : null),
    [firestore, groupId]
  );
  const { data: group, loading: groupLoading } = useDoc<Group>(groupRef);
  
  const [membersData, setMembersData] = useState<UserData[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);

  // This effect fetches all member data at once when group.members changes
  useEffect(() => {
    if (!group?.members || group.members.length === 0 || !firestore) {
      setLoadingMembers(false);
      return;
    }
    let isMounted = true;
    const fetchMembersData = async () => {
      setLoadingMembers(true);
      try {
        const usersRef = collection(firestore, 'users');
        // Firestore 'in' query is limited to 30 items
        if (group.members.length > 30) {
            console.warn("Group has more than 30 members, fetching data may be incomplete.");
        }
        const q = query(usersRef, where(documentId(), 'in', group.members.slice(0, 30)));
        const querySnapshot = await getDocs(q);
        if (isMounted) {
          const users = querySnapshot.docs.map(
            (d) => ({ ...d.data(), uid: d.id } as UserData)
          );
          setMembersData(users);
        }
      } catch (error) {
        console.error("Error fetching members' data: ", error);
      } finally {
        if (isMounted) setLoadingMembers(false);
      }
    };
    fetchMembersData();
    return () => {
      isMounted = false;
    };
  }, [group?.members, firestore]);

  const membersMap = useMemo(() => {
    return new Map(membersData.map((m: UserData) => [m.uid, m]));
  }, [membersData]);
  
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


  const groupTransactionsQuery = useMemo(
    () =>
      firestore && groupId
        ? query(
            collectionGroup(firestore, 'transactions'),
            where('groupId', '==', groupId),
            orderBy('date', 'desc')
          )
        : null,
    [firestore, groupId]
  );

  const {
    data: allGroupTransactions,
    loading: allTxsLoading,
    indexCreationUrl: allTxsIndexUrl,
  } = useCollection<Transaction>(groupTransactionsQuery);

  const weeklyContributions = useMemo(() => {
     if (!allGroupTransactions || !weekStart || !weekEnd) return [];
     return allGroupTransactions.filter(tx => 
        tx.type === 'Group Contribution' && 
        tx.date >= weekStart &&
        tx.date < weekEnd
     );
  }, [allGroupTransactions, weekStart, weekEnd]);


  const currentWeekDeposits = React.useMemo(() => {
    if (!weeklyContributions) return 0;
    return weeklyContributions.reduce((acc, tx) => acc + tx.amount, 0);
  }, [weeklyContributions]);


  if (groupLoading || allTxsLoading || loadingMembers || !group) {
    return <PageSkeleton />;
  }

  const expectedWeeklyPurse = group.contributionAmount * group.members.length;
  const isPurseComplete = currentWeekDeposits >= expectedWeeklyPurse;
  const isGroupCreator = user?.uid === group.creatorUid;

  const currentWeek = group.currentCollectionWeek || 1;
  const currentPayoutIndex = group.payoutOrder
    ? (currentWeek - 1) % group.members.length
    : null;
    
  const memoizedMemberIds = useMemo(() => group.members, [group]);
  const memoizedPayoutOrder = useMemo(() => group.payoutOrder || [], [group]);


  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <Link
        href="/admin/groups"
        className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Groups
      </Link>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>{group.name}</CardTitle>
              <CardDescription>
                Details and activities for the savings group.
              </CardDescription>
            </div>
            <Badge
              variant={group.status === 'active' ? 'default' : 'secondary'}
              className="capitalize"
            >
              {group.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  This Week's Purse
                </CardTitle>
                <Wallet className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(currentWeekDeposits)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Goal: {formatCurrency(expectedWeeklyPurse)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Members</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {group.members.length} / {group.numberOfMembers}
                </div>
                <p className="text-xs text-muted-foreground">
                  {group.numberOfMembers - group.members.length} slots
                  remaining
                </p>
              </CardContent>
            </Card>
            {group.startedAt && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">
                    Current Week
                  </CardTitle>
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

          <Separator />
          
          {memoizedPayoutOrder && memoizedPayoutOrder.length > 0 && (
             <div>
                <h3 className="text-lg font-medium flex items-center gap-2 mb-4">
                    <ListOrdered />
                    Payout Order
                </h3>
                 <GroupMembers 
                    memberIds={memoizedMemberIds}
                    payoutOrder={memoizedPayoutOrder}
                    currentPayoutIndex={currentPayoutIndex}
                />
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
                membersMap={membersMap}
                loading={allTxsLoading}
              />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
