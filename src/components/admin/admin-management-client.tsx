'use client';

import React, { useState } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Skeleton } from '../ui/skeleton';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Button } from '../ui/button';
import { Loader2, Search, Shield, Trash2, UserPlus } from 'lucide-react';
import { Input } from '../ui/input';
import { findUserByEmail, promoteToAdmin, revokeAdmin } from '@/app/(admin)/admin/management/actions';
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

interface FoundUser {
    id: string;
    email: string;
    displayName: string;
    isAdmin: boolean;
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

function PromoteUserSection() {
    const [email, setEmail] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [isPromoting, setIsPromoting] = useState(false);
    const [foundUser, setFoundUser] = useState<FoundUser | null>(null);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        setIsSearching(true);
        setFoundUser(null);
        try {
            const user = await findUserByEmail(email);
            if (user) {
                setFoundUser(user);
            } else {
                toast({ variant: 'destructive', title: 'Not Found', description: 'No user found with that email address.' });
            }
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Search Failed', description: error.message });
        } finally {
            setIsSearching(false);
        }
    };

    const handlePromote = async () => {
        if (!foundUser) return;
        setIsPromoting(true);
        try {
            const result = await promoteToAdmin(foundUser.id, foundUser.email, foundUser.displayName);
            if (result.success) {
                toast({ title: 'Success!', description: `${foundUser.displayName} has been promoted to admin.` });
                setFoundUser(null);
                setEmail('');
            } else {
                throw new Error(result.error);
            }
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Promotion Failed', description: error.message });
        } finally {
            setIsPromoting(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Promote New Admin</CardTitle>
                <CardDescription>Grant administrative privileges to an existing user by their email.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <form onSubmit={handleSearch} className="flex gap-2">
                    <Input
                        type="email"
                        placeholder="user@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={isSearching}
                    />
                    <Button type="submit" disabled={isSearching || !email}>
                        {isSearching ? <Loader2 className="animate-spin" /> : <Search />}
                        <span className="sr-only">Search</span>
                    </Button>
                </form>

                {foundUser && (
                    <Card className="p-4 bg-muted/50">
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="font-semibold">{foundUser.displayName}</p>
                                <p className="text-sm text-muted-foreground">{foundUser.email}</p>
                            </div>
                            {foundUser.isAdmin ? (
                                <span className="text-sm font-medium text-muted-foreground flex items-center gap-2"><Shield /> Already Admin</span>
                            ) : (
                                <Button onClick={handlePromote} disabled={isPromoting}>
                                    {isPromoting ? <Loader2 className="animate-spin mr-2" /> : <UserPlus className="mr-2" />}
                                    Promote to Admin
                                </Button>
                            )}
                        </div>
                    </Card>
                )}
            </CardContent>
        </Card>
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
            <PromoteUserSection />

            <Card>
                <CardHeader>
                    <CardTitle>Current Administrators</CardTitle>
                    <CardDescription>List of all users with administrative privileges.</CardDescription>
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
