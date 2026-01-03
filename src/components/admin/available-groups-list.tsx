
'use client';

import { useCollection } from '@/firebase/firestore/use-collection';
import { getFirebase } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import React, { useMemo } from 'react';
import { Skeleton } from '../ui/skeleton';
import { Card } from '../ui/card';
import { Users } from 'lucide-react';
import type { Group } from '@/lib/types';
import { MissingIndexAlert } from '../admin/missing-index-alert';
import { AdminGroupCard } from './admin-group-card';


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


export function AvailableGroupsList() {
  const { firestore } = getFirebase();
  const groupsQuery = useMemo(() => query(
        collection(firestore, `groups`), 
        where('status', 'in', ['forming', 'active']),
        orderBy('createdAt', 'desc')
    ), [firestore]);

  const { data: groups, loading, indexCreationUrl } = useCollection<Group>(groupsQuery);

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <GroupSkeleton />
        <GroupSkeleton />
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
        <Users className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">No Groups Found</h3>
        <p className="mb-4 mt-2 text-sm text-muted-foreground">
          There are currently no active or forming savings groups on the platform.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {groups.map((group) => (
        <AdminGroupCard key={group.id} group={group} />
      ))}
    </div>
  );
}
