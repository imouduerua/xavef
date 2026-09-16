
'use client';

import React from 'react';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import type { UserData } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Eye, DollarSign } from 'lucide-react';
import { MissingIndexAlert } from '@/components/admin/missing-index-alert';
import Link from 'next/link';

const formatCurrency = (amount: number | null | undefined) => {
    if (typeof amount !== 'number') return '₦0.00';
    return `₦${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function PageSkeleton() {
    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-1">
                    <CardHeader>
                        <Skeleton className="h-6 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-10 w-48" />
                    </CardContent>
                </Card>
            </div>
            <Card>
                 <CardHeader>
                    <Skeleton className="h-6 w-1/4" />
                </CardHeader>
                <CardContent>
                     <div className="space-y-2">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <Skeleton key={i} className="h-12 w-full" />
                        ))}
                     </div>
                </CardContent>
            </Card>
        </div>
    );
}

export default function PoolDetailsPage() {
    const firestore = useFirestore();

    const contributorsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'users'), where('groupPoolBalance', '>', 0), orderBy('groupPoolBalance', 'desc'));
    }, [firestore]);

    const { data: contributors, loading, indexCreationUrl } = useCollection<UserData>(contributorsQuery);

    const totalPoolBalance = React.useMemo(() => {
        if (!contributors) return 0;
        return contributors.reduce((acc, user) => acc + (user.groupPoolBalance || 0), 0);
    }, [contributors]);

    if (loading) {
        return <PageSkeleton />;
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                 <Card className="lg:col-span-1">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Pool Balance</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(totalPoolBalance)}</div>
                         <p className="text-xs text-muted-foreground">
                            Aggregated savings from all contributors.
                        </p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Pool Contributors</CardTitle>
                    <CardDescription>
                        List of all users who have contributed to the Xavef Loan & Savings Pool.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {indexCreationUrl ? (
                        <MissingIndexAlert url={indexCreationUrl} />
                    ) : !contributors || contributors.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">No contributors found in the savings pool.</p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>User</TableHead>
                                    <TableHead className="text-right">Pool Balance</TableHead>
                                    <TableHead><span className="sr-only">Actions</span></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {contributors.map((user) => (
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
                                        <TableCell className="text-right font-semibold">{formatCurrency(user.groupPoolBalance)}</TableCell>
                                        <TableCell className="text-right">
                                            <Button asChild variant="ghost" size="sm">
                                                <Link href={`/admin/users/${user.id}`}>
                                                    <Eye className="mr-2 h-4 w-4" />
                                                    View User
                                                </Link>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
