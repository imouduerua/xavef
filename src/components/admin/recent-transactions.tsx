'use client';
import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Skeleton } from '../ui/skeleton';
import { ArrowUpRight } from 'lucide-react';
import { Button } from '../ui/button';
import Link from 'next/link';

export function RecentTransactions() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center">
        <div className="grid gap-2">
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>A log of the latest completed transactions.</CardDescription>
        </div>
         <Button asChild size="sm" className="ml-auto gap-1">
            <Link href="/admin/transactions">
                View All
                <ArrowUpRight className="h-4 w-4" />
            </Link>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="text-center text-sm text-muted-foreground py-8">
            Data fetching is temporarily disabled for debugging.
        </div>
      </CardContent>
    </Card>
  );
}

RecentTransactions.Skeleton = function SkeletonComponent() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </CardContent>
    </Card>
  );
};
