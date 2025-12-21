
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
import { MyGroupsList } from './my-groups-list';
import { JoinRequestsList } from './join-requests-list';
import { Separator } from '../ui/separator';

function SectionSkeleton() {
    return (
        <div className="space-y-4">
             <Skeleton className="h-6 w-1/4" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <div className="p-6 space-y-4">
                        <Skeleton className="h-6 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                    </div>
                </Card>
            </div>
        </div>
    )
}

export function MyGroupsSection() {
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

  const joinRequestsQuery = React.useMemo(() => {
      if (!user) return null;
      return query(
          collection(firestore, 'joinRequests'),
          where('groupCreatorUid', '==', user.uid),
          where('status', '==', 'pending'),
          orderBy('createdAt', 'desc')
      );
  }, [user, firestore]);

  const { data: groups, loading, indexCreationUrl } = useCollection<Group>(myGroupsQuery);
  const { data: joinRequests, loading: requestsLoading, indexCreationUrl: requestsIndexUrl } = useCollection(joinRequestsQuery);

  if (loading || requestsLoading) {
    return <SectionSkeleton />;
  }

  if (indexCreationUrl) {
    return <MissingIndexAlert url={indexCreationUrl} />;
  }
   if (requestsIndexUrl) {
    return <MissingIndexAlert url={requestsIndexUrl} />;
  }

  const hasGroups = groups && groups.length > 0;
  const hasRequests = joinRequests && joinRequests.length > 0;

  if (!hasGroups && !hasRequests) {
      return null; // Don't render the section if there's nothing to show
  }

  return (
    <div className='space-y-6'>
      {hasRequests && (
        <div>
            <h3 className="text-xl font-semibold mb-4">Pending Join Requests</h3>
            <JoinRequestsList requests={joinRequests} />
        </div>
      )}
       {hasRequests && hasGroups && <Separator />}
      {hasGroups && (
        <div>
            <h3 className="text-xl font-semibold mb-4">My Groups</h3>
            <MyGroupsList groups={groups} />
        </div>
      )}
    </div>
  );
}
