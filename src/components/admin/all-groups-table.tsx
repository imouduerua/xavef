'use client';

import React from 'react';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import type { Group } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '../ui/skeleton';
import { Badge } from '../ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from '../ui/button';
import { MoreHorizontal, Eye } from 'lucide-react';
import { MissingIndexAlert } from './missing-index-alert';
import Link from 'next/link';

const formatDate = (date: any) => {
  if (!date) return 'N/A';
  const d = date.toDate ? date.toDate() : new Date(date);
  if (isNaN(d.getTime())) return 'Invalid Date';
  return d.toLocaleDateString();
};

const formatCurrency = (amount: number | null | undefined) => {
    if (typeof amount !== 'number') return '₦0.00';
    return `₦${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const statusVariant: Record<Group['status'], 'default' | 'secondary' | 'destructive'> = {
  active: 'default',
  forming: 'secondary',
  closed: 'destructive',
};

function TableSkeleton() {
    return (
        <Card>
            <CardContent className="pt-6">
                 <div className="space-y-2">
                    {Array.from({ length: 10 }).map((_, i) => (
                        <Skeleton key={i} className="h-12 w-full" />
                    ))}
                 </div>
            </CardContent>
        </Card>
    );
}

export function AllGroupsTable() {
  const firestore = useFirestore();

  const groupsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'groups'), orderBy('createdAt', 'desc'), limit(50));
  }, [firestore]);

  const { data: groups, loading, indexCreationUrl } = useCollection<Group>(groupsQuery);

  if (loading) {
    return <TableSkeleton />;
  }

  if (indexCreationUrl) {
    return <MissingIndexAlert url={indexCreationUrl} />;
  }
  
  if (!groups || groups.length === 0) {
    return (
        <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
                <p>No groups found.</p>
            </CardContent>
        </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Group Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Members</TableHead>
              <TableHead>Contribution</TableHead>
              <TableHead>Date Created</TableHead>
              <TableHead><span className="sr-only">Actions</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {groups.map((group) => (
              <TableRow key={group.id}>
                <TableCell className="font-medium">{group.name}</TableCell>
                <TableCell>
                    <Badge variant={statusVariant[group.status]} className="capitalize">{group.status}</Badge>
                </TableCell>
                <TableCell>{group.members.length} / {group.numberOfMembers}</TableCell>
                <TableCell>{formatCurrency(group.contributionAmount)}</TableCell>
                <TableCell>{formatDate(group.createdAt)}</TableCell>
                <TableCell>
                     <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/groups/${group.id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                            </Link>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
