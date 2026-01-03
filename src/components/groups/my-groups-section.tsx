
'use client';

import { useCollection } from '@/firebase/firestore/use-collection';
import { firestore } from '@/firebase/client';
import { useAuthContext } from '@/context/auth-context';
import { collection, query, where, orderBy } from 'firebase/firestore';
import React, { useMemo } from 'react';
import { Skeleton } from '../ui/skeleton';
import type { Group, GroupJoinRequest } from '@/lib/types';
import { MissingIndexAlert } from '../admin/missing-index-alert';
import { MyGroupsList } from './my-groups-list';
import { JoinRequestsList } from './join-requests-list';
import { Separator } from '../ui/separator';
import { Card } from '../ui/card';

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
  const { user } = useAuthContext();
  const uid = user?.uid;

  const myGroupsQuery = useMemo(() => (uid) ? query(
        collection(firestore, `groups`), 
        where('members', 'array-contains', uid),
        orderBy('createdAt', 'desc')
    ) : null, [uid]);

  const joinRequestsQuery = useMemo(() => (uid) ? query(
          collection(firestore, 'joinRequests'),
          where('groupCreatorUid', '==', uid),
          where('status', '==', 'pending'),
          orderBy('createdAt', 'desc')
      ) : null, [uid]);

  const { data: groups, loading: groupsLoading, indexCreationUrl: groupsIndexUrl } = useCollection<Group>(myGroupsQuery);
  const { data: joinRequests, loading: requestsLoading, indexCreationUrl: requestsIndexUrl } = useCollection<GroupJoinRequest>(joinRequestsQuery);

  if (groupsIndexUrl) {
    return <MissingIndexAlert url={groupsIndexUrl} />;
  }
   if (requestsIndexUrl) {
    return <MissingIndexAlert url={requestsIndexUrl} />;
  }

  if (groupsLoading || requestsLoading) {
    return <SectionSkeleton />;
  }

  const hasGroups = groups && groups.length > 0;
  const hasRequests = joinRequests && joinRequests.length > 0;

  if (!hasGroups && !hasRequests) {
      return (
        <div>
            <h3 className="text-xl font-semibold mb-4">My Groups</h3>
            <MyGroupsList groups={[]} />
        </div>
      );
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
