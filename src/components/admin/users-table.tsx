
'use client';

import React, { useMemo } from 'react';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { useCollection } from '@/firebase/firestore/use-collection';
import type { UserData } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '../ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from '../ui/button';
import { MoreHorizontal } from 'lucide-react';
import { MissingIndexAlert } from './missing-index-alert';

const formatDate = (date: any) => {
  if (!date) return 'N/A';
  if (date.toDate) {
    return date.toDate().toLocaleDateString();
  }
  const d = new Date(date);
  if (isNaN(d.getTime())) return 'Invalid Date';
  return d.toLocaleDateString();
};

const formatCurrency = (amount: number | null | undefined) => {
    if (typeof amount !== 'number') return '₦0.00';
    return `₦${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}


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

export function UsersTable() {
  const firestore = useFirestore();
  const usersQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'users'), orderBy('createdAt', 'desc'), limit(50));
  }, [firestore]);

  const { data: users, loading, indexCreationUrl } = useCollection<UserData>(usersQuery);

  if (indexCreationUrl) {
    return <MissingIndexAlert url={indexCreationUrl} />;
  }

  if (loading) {
    return <TableSkeleton />;
  }

  if (!users) {
    return <p>No users found.</p>;
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Xavef ID</TableHead>
              <TableHead>Olidara Balance</TableHead>
              <TableHead>Annual Balance</TableHead>
              <TableHead>Date Joined</TableHead>
              <TableHead><span className="sr-only">Actions</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium flex items-center gap-3">
                    <Avatar>
                        <AvatarImage src={undefined} alt={user.displayName} />
                        <AvatarFallback>{user.displayName?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                        <p>{user.displayName}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                </TableCell>
                <TableCell>{user.xavefId}</TableCell>
                <TableCell>{formatCurrency(user.solidaraBalance)}</TableCell>
                <TableCell>{formatCurrency(user.annualBalance)}</TableCell>
                <TableCell>{formatDate(user.createdAt)}</TableCell>
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
                        <DropdownMenuItem
                            onClick={() => navigator.clipboard.writeText(user.email)}
                        >
                            Copy user email
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>View transactions</DropdownMenuItem>
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
