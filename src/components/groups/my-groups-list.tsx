
'use client';

import React from 'react';
import { UserCheck } from 'lucide-react';
import type { Group } from '@/lib/types';
import { GroupCard } from './group-card';


interface MyGroupsListProps {
    groups: Group[] | null;
}

export function MyGroupsList({ groups }: MyGroupsListProps) {
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
