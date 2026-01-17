'use client';

import React from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Skeleton } from '../ui/skeleton';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Button } from '../ui/button';
import { Trash2 } from 'lucide-react';
import { revokeAdmin } from '@/app/(admin)/admin/management/actions';
import { toast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';
import { useUser } from '@/firebase';

interface AdminUser {
    id: string;
    displayName: string;
    email: string;
    promotedAt: any;
    promotedBy: string;
}

const formatDate = (date: any) => {
    if (!date) return 'N/A';
    const d = date.toDate ? date.toDate() : new Date(date);
    if (isNaN(d.getTime())) return 'Invalid Date';
    return d.toLocaleString();
};

function AdminListSkeleton() {
    return (
        <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-48" />
                    </div>
                </div>
            ))}
        </div>
    );
}

export function AdminManagementClient() {
    const firestore = useFirestore();
    const { user: currentUser } = useUser();
    const adminsQuery = useMemoFirebase(() => (firestore ? query(collection(firestore, 'admins'), orderBy('promotedAt', 'desc')) : null), [firestore]);
    const { data: admins, loading } = useCollection<AdminUser>(adminsQuery);
    
    const handleRevoke = async (userId: string, displayName: string) => {
        try {
            const result = await revokeAdmin(userId);
             if (result.success) {
                toast({ title: 'Admin Revoked', description: `${displayName} is no longer an admin.` });
            } else {
                throw new Error(result.error);
            }
        } catch (error: any) {
             toast({ variant: 'destructive', title: 'Failed to Revoke Admin', description: error.message });
        }
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Current Administrators</CardTitle>
                    <CardDescription>List of all users with administrative privileges. New admins can be promoted from the 'Users' page by a super admin.</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? <AdminListSkeleton /> : (
                        <div className="space-y-4">
                            {admins?.map(admin => (
                                <div key={admin.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                                    <Avatar>
                                        <AvatarFallback>{admin.displayName?.charAt(0) || 'A'}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                        <p className="font-semibold">{admin.displayName}</p>
                                        <p className="text-sm text-muted-foreground">{admin.email}</p>
                                        <p className="text-xs text-muted-foreground pt-1">Promoted on {formatDate(admin.promotedAt)} by {admin.promotedBy}</p>
                                    </div>
                                    {admin.id !== currentUser?.uid ? (
                                         <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 hover:text-destructive">
                                                    <Trash2 />
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Revoke Admin Privileges?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        Are you sure you want to revoke admin rights for {admin.displayName}? They will lose all administrative access immediately.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction
                                                        className="bg-destructive hover:bg-destructive/90"
                                                        onClick={() => handleRevoke(admin.id, admin.displayName)}
                                                    >
                                                        Yes, Revoke
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    ) : (
                                         <Button variant="ghost" size="icon" disabled title="You cannot revoke your own privileges.">
                                            <Trash2 />
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
