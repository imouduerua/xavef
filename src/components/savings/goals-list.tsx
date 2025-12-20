
'use client';

import { useCollection, useFirestore, useUser } from '@/firebase';
import type { SavingGoal } from '@/lib/types';
import { collection, query, orderBy } from 'firebase/firestore';
import React from 'react';
import { GoalCard } from './goal-card';
import { Skeleton } from '../ui/skeleton';
import { Card } from '../ui/card';
import { Target } from 'lucide-react';

function GoalSkeleton() {
    return (
        <Card>
            <div className="p-6 space-y-4">
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-4 w-3/4" />
            </div>
        </Card>
    )
}


export function GoalsList() {
  const { user } = useUser();
  const firestore = useFirestore();

  const goalsQuery = React.useMemo(() => {
    if (!user) return null;
    return query(collection(firestore, `users/${user.uid}/goals`), orderBy('createdAt', 'desc'));
  }, [user, firestore]);

  const { data: goals, loading } = useCollection<SavingGoal>(goalsQuery);

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <GoalSkeleton />
        <GoalSkeleton />
        <GoalSkeleton />
      </div>
    );
  }

  if (!goals || goals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/20 p-12 text-center">
        <Target className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">No Saving Goals Yet</h3>
        <p className="mb-4 mt-2 text-sm text-muted-foreground">
          Create a new goal to start tracking your savings.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {goals.map((goal) => (
        <GoalCard key={goal.id} goal={goal} />
      ))}
    </div>
  );
}
