
'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { collection, query, orderBy, limit, Query, doc } from 'firebase/firestore';
import { useFirestore, useUser, useMemoFirebase } from '@/firebase';
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
import { MoreHorizontal, Eye, UserPlus, Shield } from 'lucide-react';
import { MissingIndexAlert } from './missing-index-alert';
import Link from 'next/link';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { promoteToAdmin } from '@/app/(admin)/admin/management/actions';
import { toast } from '@/hooks/use-toast';

interface AdminUser { id: string; }

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
  const { user: currentUser } = useUser();
  
  const usersQuery = useMemoFirebase(() => 
      (firestore ? query(collection(firestore, 'users'), orderBy('createdAt', 'desc'), limit(50)) : null) as Query<UserData> | null, 
  [firestore]);

  const adminsQuery = useMemoFirebase(() => 
      firestore ? collection(firestore, 'admins') : null, 
  [firestore]);

  const { data: users, loading: usersLoading, indexCreationUrl } = useCollection<UserData>(usersQuery);
  const { data: admins, loading: adminsLoading } = useCollection<AdminUser>(adminsQuery);
  
  const adminUids = useMemo(() => {
      if (!admins) return new Set<string>();
      return new Set(admins.map(admin => admin.id));
  }, [admins]);

  const isSuperAdmin = currentUser?.email === 'admin@xavef.com';

  const handlePromote = async (userToPromote: UserData) => {
      try {
          const result = await promoteToAdmin(userToPromote.id, userToPromote.email, userToPromote.displayName);
          if (result.success) {
              toast({ title: 'Success!', description: `${userToPromote.displayName} has been promoted to admin.` });
          } else {
              throw new Error(result.error);
          }
      } catch (error: any) {
          toast({ variant: 'destructive', title: 'Promotion Failed', description: error.message });
      }
  };

  const loading = usersLoading || adminsLoading;


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
            {users.map((user) => {
              const isAlreadyAdmin = adminUids.has(user.id);
              return (
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
                <TableCell>{formatCurrency(user.olidaraBalance)}</TableCell>
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
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/users/${user.id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                            </Link>
                          </DropdownMenuItem>
                          {isSuperAdmin && (
                            <>
                              <DropdownMenuSeparator />
                              {isAlreadyAdmin ? (
                                <DropdownMenuItem disabled>
                                    <Shield className="mr-2 h-4 w-4" />
                                    Already an Admin
                                </DropdownMenuItem>
                              ) : (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                      <UserPlus className="mr-2 h-4 w-4" />
                                      Promote to Admin
                                    </DropdownMenuItem>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                      <AlertDialogHeader>
                                          <AlertDialogTitle>Promote {user.displayName}?</AlertDialogTitle>
                                          <AlertDialogDescription>
                                              Are you sure you want to grant admin privileges to this user? They will have access to all administrative functions.
                                          </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                                          <AlertDialogAction onClick={() => handlePromote(user)}>
                                              Yes, Promote
                                          </AlertDialogAction>
                                      </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              )}
                            </>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => navigator.clipboard.writeText(user.email)}>
                              Copy user email
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </TableCell>
              </TableRow>
            )})}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
