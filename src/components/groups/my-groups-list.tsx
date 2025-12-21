
'use client';

import { useCollection, useFirestore, useUser } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import React from 'react';
import { Skeleton } from '../ui/skeleton';
import { Card } from '../ui/card';
import { UserCheck } from 'lucide-react';
import type { Group } from '@/lib/types';
import { GroupCard } from './group-card';
import { MissingIndexAlert } from '../admin/missing-index-alert';

function GroupSkeleton() {
    return (
        <Card>
            <div className="p-6 space-y-4">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <div className='flex justify-between items-center'>
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-4 w-1/4" />
                </div>
                 <Skeleton className="h-10 w-full" />
            </div>
        </Card>
    )
}

export function MyGroupsList() {
  const firestore = useFirestore();
  const { user } = useUser();

  const myGroupsQuery = React.useMemo(() => {
    if (!firestore || !user) return null;
    return query(
        collection(firestore, `groups`), 
        where('members', 'array-contains', user.uid),
        orderBy('createdAt', 'desc')
    );
  }, [firestore, user]);

  const { data: groups, loading, indexCreationUrl } = useCollection<Group>(myGroupsQuery);

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <GroupSkeleton />
      </div>
    );
  }

  if (indexCreationUrl) {
    return <MissingIndexAlert url={indexCreationUrl} />;
  }

  if (!groups || groups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/20 p-12 text-center">
        <UserCheck className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">You Haven't Joined Any Groups</h3>
        <p className="mb-4 mt-2 text-sm text-muted-foreground">
          Join an available group or create a new one to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {groups.map((group) => (
        <GroupCard key={group.id} group={group} isOwned={true} />
      ))}
    </div>
  );
}
