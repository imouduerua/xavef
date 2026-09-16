
'use client';

import type { GroupJoinRequest } from '@/lib/types';
import { JoinRequestCard } from './join-request-card';

interface JoinRequestsListProps {
    requests: GroupJoinRequest[];
}

export function JoinRequestsList({ requests }: JoinRequestsListProps) {
    return (
        <div className="space-y-4">
            {requests.map(request => (
                <JoinRequestCard key={request.id} request={request} />
            ))}
        </div>
    )
}
