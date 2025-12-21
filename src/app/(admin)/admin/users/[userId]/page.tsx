
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
import { doc, updateDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { ArrowLeft, Landmark, PiggyBank, BadgePercent } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import React, { useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import type { UserData } from '@/lib/types';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useAdminStatus } from '@/hooks/use-admin-status';
import { toast } from '@/hooks/use-toast';

export default function UserDetailPage() {
  const params = useParams();
  const userId = params.userId as string;
  const firestore = useFirestore();
  const { user: adminUser } = useUser();
  const { isSuperAdmin } = useAdminStatus();
  const [isUpdatingPermission, setIsUpdatingPermission] = React.useState(false);

  const userDocRef = useMemo(
    () => (userId && firestore ? doc(firestore, 'users', userId) : null),
    [userId, firestore]
  );
  
  const generatorDocRef = useMemo(
    () => (userId && firestore ? doc(firestore, 'referralCodeGenerators', userId) : null),
    [userId, firestore]
  );

  const { data: userData, loading } = useDoc<UserData>(userDocRef);
  const { data: generatorData, loading: generatorLoading } = useDoc(generatorDocRef);

  const canGenerate = !!generatorData;

  const formatCurrency = (amount: number | null | undefined) => {
    if (amount === undefined || amount === null) {
      return '₦0.00';
    }
    return `₦${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };
  
  const handlePermissionChange = async (shouldBeAbleToGenerate: boolean) => {
    if (!generatorDocRef || !userData || !adminUser?.email) return;

    setIsUpdatingPermission(true);
    try {
        if (shouldBeAbleToGenerate) {
            await setDoc(generatorDocRef, { enabledBy: adminUser.email, enabledAt: new Date() });
        } else {
            await deleteDoc(generatorDocRef);
        }
        toast({
            title: "Permission Updated",
            description: `${userData.email} can ${shouldBeAbleToGenerate ? 'now' : 'no longer'} generate referral codes.`
        })
    } catch (error: any) {
        console.error("Error updating permission:", error);
        toast({
            variant: "destructive",
            title: "Update Failed",
            description: error.message || "You do not have permission to perform this action."
        })
    } finally {
        setIsUpdatingPermission(false);
    }
  }

  const PageSkeleton = () => (
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
  )

  if (loading || generatorLoading || !userId || !userData) {
    return <PageSkeleton />;
  }

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
                        <CardTitle className="text-sm font-medium">Solidara Savings</CardTitle>
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

            {isSuperAdmin && (
              <div>
                <h3 className="text-lg font-medium">Permissions</h3>
                <Separator className="my-4" />
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between space-x-2">
                        <div className='space-y-1.5'>
                            <Label htmlFor="referral-permission" className="font-semibold">Generate Referral Codes</Label>
                            <p className="text-sm text-muted-foreground">
                                Allow this user to generate new referral codes for others to use during signup.
                            </p>
                        </div>
                        <Switch
                          id="referral-permission"
                          checked={canGenerate}
                          onCheckedChange={handlePermissionChange}
                          disabled={isUpdatingPermission}
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
