
'use client';

import { UserList } from '@/components/admin/user-list';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useCollection, useFirestore } from '@/firebase';
import type { UserData } from '@/lib/types';
import { collection, orderBy, query } from 'firebase/firestore';
import React, { useMemo } from 'react';

type UserDataWithId = UserData & { id: string };

export default function AdminUsersPage() {
  const firestore = useFirestore();

  const usersQuery = useMemo(() => firestore ? query(collection(firestore, 'users'), orderBy('email')) : null, [firestore]);

  const { data: users, loading } = useCollection<UserDataWithId>(usersQuery);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <CardDescription>
            Oversee all users and their transactions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UserList users={users} loading={loading} />
        </CardContent>
      </Card>
    </div>
  );
}
