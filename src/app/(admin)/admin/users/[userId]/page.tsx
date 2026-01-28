
'use client';

import { useDoc, useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { useParams, useRouter } from 'next/navigation';
import React from 'react';
import type { UserData, Transaction } from '@/lib/types';
import { doc, collection, query, orderBy } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { ArrowLeft, User, Wallet, Calendar, AtSign, Fingerprint, UserPlus } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

function PageSkeleton() {
    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
            <Skeleton className="h-6 w-32" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-6">
                    <Card>
                        <CardHeader className="items-center text-center">
                            <Skeleton className="h-12 w-12 rounded-full" />
                            <Skeleton className="h-6 w-48" />
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Skeleton className="h-5 w-full" />
                            <Skeleton className="h-5 w-full" />
                            <Skeleton className="h-5 w-full" />
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader>
                             <Skeleton className="h-6 w-24" />
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Skeleton className="h-5 w-full" />
                            <Skeleton className="h-5 w-full" />
                        </CardContent>
                    </Card>
                </div>
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <Skeleton className="h-6 w-40" />
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <Skeleton className="h-12 w-full" />
                                <Skeleton className="h-12 w-full" />
                                <Skeleton className="h-12 w-full" />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

const formatDate = (date: any) => {
    if (!date) return 'N/A';
    const d = date.toDate ? date.toDate() : new Date(date);
    if (isNaN(d.getTime())) return 'Invalid Date';
    return d.toLocaleString();
};

const formatCurrency = (amount: number | undefined | null) => {
    if (typeof amount !== 'number') return '₦0.00';
    return `₦${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const statusVariant: Record<Transaction['status'], 'default' | 'secondary' | 'destructive'> = {
  Completed: 'default',
  Pending: 'secondary',
  Failed: 'destructive',
};

export default function UserDetailPage() {
    const params = useParams();
    const userId = params.userId as string;
    const firestore = useFirestore();

    const userDocRef = useMemoFirebase(() => (firestore && userId) ? doc(firestore, 'users', userId) : null, [firestore, userId]);
    const { data: user, loading: userLoading } = useDoc<UserData>(userDocRef);

    const referrerDocRef = useMemoFirebase(() => (firestore && user?.referredBy) ? doc(firestore, 'users', user.referredBy) : null, [firestore, user?.referredBy]);
    const { data: referrer, loading: referrerLoading } = useDoc<UserData>(referrerDocRef);

    const transactionsQuery = useMemoFirebase(() => (firestore && userId) ? query(collection(firestore, 'users', userId, 'transactions'), orderBy('date', 'desc')) : null, [firestore, userId]);
    const { data: transactions, loading: transactionsLoading } = useCollection<Transaction>(transactionsQuery);

    if (userLoading || transactionsLoading || referrerLoading) {
        return <PageSkeleton />;
    }

    if (!user) {
        return (
            <div className="p-4 sm:p-6 lg:p-8">
                <Card>
                    <CardHeader>
                        <CardTitle>User Not Found</CardTitle>
                        <CardDescription>The requested user could not be found.</CardDescription>
                    </CardHeader>
                </Card>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
            <Link href="/admin/users" className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-4 w-4" />
                Back to All Users
            </Link>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-6">
                    <Card>
                        <CardHeader className="items-center text-center">
                            <User className="h-12 w-12 text-muted-foreground" />
                            <CardTitle className="text-2xl">{user.displayName}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground flex items-center gap-2"><AtSign className="h-4 w-4" /> Email</span>
                                <span className="font-medium truncate">{user.email}</span>
                            </div>
                             <div className="flex justify-between">
                                <span className="text-muted-foreground flex items-center gap-2"><Fingerprint className="h-4 w-4" /> Xavef ID</span>
                                <span className="font-mono">{user.xavefId}</span>
                            </div>
                             <div className="flex justify-between">
                                <span className="text-muted-foreground flex items-center gap-2"><Calendar className="h-4 w-4" /> Joined</span>
                                <span className="font-medium">{formatDate(user.createdAt)}</span>
                            </div>
                             {referrer && (
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground flex items-center gap-2"><UserPlus className="h-4 w-4" /> Referred By</span>
                                    <Link href={`/admin/users/${referrer.id}`} className="font-medium text-primary hover:underline truncate">{referrer.displayName}</Link>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Wallet className="h-5 w-5" /> Balances</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                             <div className="flex justify-between items-baseline">
                                <span className="text-muted-foreground">Olidara Savings</span>
                                <span className="font-bold text-lg">{formatCurrency(user.olidaraBalance)}</span>
                            </div>
                             <div className="flex justify-between items-baseline">
                                <span className="text-muted-foreground">Annual Savings</span>
                                <span className="font-bold text-lg">{formatCurrency(user.annualBalance)}</span>
                            </div>
                             <div className="flex justify-between items-baseline">
                                <span className="text-muted-foreground">Group Pool Savings</span>
                                <span className="font-bold text-lg">{formatCurrency(user.groupPoolBalance)}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Transaction History</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {transactions && transactions.length > 0 ? (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Description</TableHead>
                                            <TableHead>Type</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Date</TableHead>
                                            <TableHead className="text-right">Amount</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {transactions.map(tx => {
                                            const amount = Number(tx.amount);
                                            const isCredit = amount > 0;
                                            return (
                                                <TableRow key={tx.id}>
                                                    <TableCell className="font-medium">{tx.description}</TableCell>
                                                    <TableCell>{tx.type}</TableCell>
                                                    <TableCell><Badge variant={statusVariant[tx.status]}>{tx.status}</Badge></TableCell>
                                                    <TableCell>{formatDate(tx.date)}</TableCell>
                                                    <TableCell className={`text-right font-semibold ${isCredit ? 'text-green-600' : 'text-destructive'}`}>
                                                        {isCredit ? `+${formatCurrency(amount)}` : formatCurrency(amount)}
                                                    </TableCell>
                                                </TableRow>
                                            )
                                        })}
                                    </TableBody>
                                </Table>
                            ) : (
                                <p className="text-sm text-muted-foreground text-center py-8">No transactions found for this user.</p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
