
'use client';

import { UserTransactions } from '@/components/admin/user-transactions';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useDoc, useFirestore, useUser } from '@/firebase';
import { doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { ArrowLeft, Landmark, PiggyBank } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import React, { useCallback, useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import type { UserData } from '@/lib/types';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useAdminStatus } from '@/hooks/use-admin-status';
import { toast } from '@/hooks/use-toast';

function PageSkeleton() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <Skeleton className="h-6 w-32" />
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-6">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}

function UserDetailsContent({ userData, adminUser, isSuperAdmin }: { userData: UserData, adminUser: any, isSuperAdmin: boolean }) {
  const userId = userData.uid;
  const [isUpdatingPermission, setIsUpdatingPermission] = React.useState(false);
  const firestore = useFirestore();
  
  const adminDocRef = useMemo(() => firestore && userId ? doc(firestore, 'admins', userId) : null, [firestore, userId]);
  const { data: adminStatusData, loading: adminStatusLoading } = useDoc(adminDocRef);
  const isUserAdmin = !!adminStatusData;

  const handlePermissionChange = useCallback(async (isNowAdmin: boolean) => {
    if (!adminDocRef || !userData || !adminUser?.email || !firestore) return;

    setIsUpdatingPermission(true);
    try {
        if (isNowAdmin) {
            await setDoc(adminDocRef, { 
              isAdmin: true,
              promotedBy: adminUser.email, 
              promotedAt: serverTimestamp()
            });
        } else {
            await deleteDoc(adminDocRef);
        }
        toast({
            title: "Permissions Updated",
            description: `${userData.email} is ${isNowAdmin ? 'now' : 'no longer'} an admin.`
        })
    } catch (error: any) {
        console.error("Error updating admin status:", error);
        toast({
            variant: "destructive",
            title: "Update Failed",
            description: error.message || "You do not have permission to perform this action."
        })
    } finally {
        setIsUpdatingPermission(false);
    }
  }, [adminDocRef, userData, adminUser?.email, firestore]);

  const formatCurrency = (amount: number | null | undefined) => {
    if (amount === undefined || amount === null) {
      return '₦0.00';
    }
    return `₦${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };
  
  const fullName = userData?.firstName || userData?.lastName ? `${userData.firstName} ${userData.lastName}`.trim() : (userData?.displayName || 'User');

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
       <Link href="/admin/users" className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        Back to User List
      </Link>
      <Card>
        <CardHeader>
          <CardTitle>
            User Profile: {fullName}
          </CardTitle>
          <CardDescription>
            Viewing details and transactions for {userData?.email || '...'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <div>
              <h3 className="text-lg font-medium">Account Balances</h3>
              <Separator className="my-4" />
                <div className="grid md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Olidara Savings</CardTitle>
                        <PiggyBank className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(userData?.solidaraBalance)}</div>
                    </CardContent>
                  </Card>
                   <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Annual Savings</CardTitle>
                        <Landmark className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(userData?.annualBalance)}</div>
                    </CardContent>
                  </Card>
                </div>
            </div>

            {isSuperAdmin && userId !== adminUser?.uid && (
              <div>
                <h3 className="text-lg font-medium">Permissions</h3>
                <Separator className="my-4" />
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between space-x-2">
                        <div className='space-y-1.5'>
                            <Label htmlFor="admin-permission" className="font-semibold">Admin Status</Label>
                            <p className="text-sm text-muted-foreground">
                                Grant this user admin privileges. Admins can approve transactions.
                            </p>
                        </div>
                        <Switch
                          id="admin-permission"
                          checked={isUserAdmin}
                          onCheckedChange={handlePermissionChange}
                          disabled={isUpdatingPermission || adminStatusLoading}
                        />
                      </div>
                    </CardContent>
                  </Card>
              </div>
            )}

             <div>
                <h3 className="text-lg font-medium">Transaction History</h3>
                 <Separator className="my-4" />
                 {userId ? <UserTransactions userId={userId} /> : <p>User ID not found.</p>}
            </div>
        </CardContent>
      </Card>
    </div>
  );
}


export default function UserDetailPage() {
  const params = useParams();
  const userId = params.userId as string;
  const { user: adminUser } = useUser();
  const { isSuperAdmin } = useAdminStatus();
  const firestore = useFirestore();

  const userDocRef = useMemo(() => firestore && userId ? doc(firestore, 'users', userId) : null, [firestore, userId]);
  const { data: userData, loading: userLoading } = useDoc<UserData>(userDocRef);

  if (userLoading) {
    return <PageSkeleton />;
  }

  if (!userData) {
    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>User Not Found</CardTitle>
                    <CardDescription>
                        This user does not have a profile in the database.
                    </CardDescription>
                </CardHeader>
            </Card>
        </div>
    )
  }

  return <UserDetailsContent userData={userData} adminUser={adminUser} isSuperAdmin={isSuperAdmin} />
}
