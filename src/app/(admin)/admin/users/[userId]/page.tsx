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
import { UserData } from '@/lib/types';
import { doc, updateDoc } from 'firebase/firestore';
import { ArrowLeft, Landmark, PiggyBank, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import { useAdminStatus } from '@/hooks/use-admin-status';


export default function UserDetailPage() {
  const params = useParams();
  const userId = params.userId as string;
  const firestore = useFirestore();
  const { user: adminUser } = useUser();
  const { isAdmin } = useAdminStatus();
  const [isUpdating, setIsUpdating] = React.useState(false);

  const userDocRef = React.useMemo(
    () => (userId && firestore ? doc(firestore, 'users', userId) : null),
    [userId, firestore]
  );
  const { data: userData, loading } = useDoc<UserData>(userDocRef);

  const canTogglePermissions = adminUser?.email === 'admin@xavef.com';

  const handlePermissionToggle = async (checked: boolean) => {
      if (!userDocRef || !canTogglePermissions) return;

      setIsUpdating(true);
      try {
          await updateDoc(userDocRef, { canGenerateReferralCode: checked });
          toast({
              title: "Permission Updated",
              description: `${userData?.firstName || 'User'} can ${checked ? 'now' : 'no longer'} generate referral codes.`,
          });
      } catch (error: any) {
          console.error("Failed to update permission", error);
          toast({
              variant: "destructive",
              title: "Update Failed",
              description: error.message,
          });
      } finally {
          setIsUpdating(false);
      }
  }

  const formatCurrency = (amount: number | null | undefined) => {
    if (amount === undefined || amount === null) {
      return '₦0.00';
    }
    return `₦${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };
  
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

  if (!userId || loading) {
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

            {isAdmin && canTogglePermissions && (
                 <div>
                    <h3 className="text-lg font-medium">Permissions</h3>
                    <Separator className="my-4" />
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <Label htmlFor="referral-permission" className="font-medium">
                                        Generate Referral Codes
                                    </Label>
                                    <p className="text-sm text-muted-foreground">
                                        Allow this user to generate one-time codes for new user sign-ups.
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    {isUpdating && <Loader2 className="h-4 w-4 animate-spin" />}
                                    <Switch
                                        id="referral-permission"
                                        checked={!!userData?.canGenerateReferralCode}
                                        onCheckedChange={handlePermissionToggle}
                                        disabled={isUpdating}
                                    />
                                </div>
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
