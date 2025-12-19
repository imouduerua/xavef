'use client';

import { UserTransactions } from '@/components/admin/user-transactions';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useDoc, useFirestore } from '@/firebase';
import { UserData } from '@/lib/types';
import { doc } from 'firebase/firestore';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import React from 'react';

export default function UserTransactionsPage() {
  const params = useParams();
  const { userId } = params as { userId: string };
  const firestore = useFirestore();

  const userDocRef = React.useMemo(
    () => (userId ? doc(firestore, 'users', userId) : null),
    [userId, firestore]
  );
  const { data: userData, loading } = useDoc<UserData>(userDocRef);

  return (
    <div className="space-y-4">
       <Link href="/admin" className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        Back to User List
      </Link>
      <Card>
        <CardHeader>
          <CardTitle>
            Transaction History for {loading ? '...' : userData?.email}
          </CardTitle>
          <CardDescription>
            Viewing all transactions for user ID: {userId}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UserTransactions userId={userId} />
        </CardContent>
      </Card>
    </div>
  );
}
