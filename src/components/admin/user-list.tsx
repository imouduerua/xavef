'use client';

import { useCollection, useFirestore } from '@/firebase';
import { UserData } from '@/lib/types';
import { collection, orderBy, query } from 'firebase/firestore';
import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { Skeleton } from '../ui/skeleton';
import { Button } from '../ui/button';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export function UserList() {
  const firestore = useFirestore();
  const usersQuery = React.useMemo(
    () => query(collection(firestore, 'users'), orderBy('email')),
    [firestore]
  );
  const { data: users, loading } = useCollection<UserData>(usersQuery);

  if (loading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (!users || users.length === 0) {
    return <p>No users found.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Email</TableHead>
          <TableHead>Xavef ID</TableHead>
          <TableHead>Created At</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => (
          <TableRow key={user.uid}>
            <TableCell className="font-medium">{user.email}</TableCell>
            <TableCell>{user.xavefId}</TableCell>
            <TableCell>
              {user.createdAt
                ? new Date(user.createdAt).toLocaleDateString()
                : 'N/A'}
            </TableCell>
            <TableCell className="text-right">
              <Button variant="outline" size="sm" asChild>
                <Link href={`/admin/users/${user.uid}`}>
                  View Transactions
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
