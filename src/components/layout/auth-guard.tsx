
'use client';

import React, { useEffect } from 'react';
import { useAuthContext } from '@/context/auth-context';
import { useAdminStatus } from '@/hooks/use-admin-status';
import { useRouter, usePathname } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuthContext();
  const { isAdmin, loading: adminLoading } = useAdminStatus();
  const router = useRouter();
  const pathname = usePathname();

  const isInsideAdmin = pathname.startsWith('/admin');

  useEffect(() => {
    // Wait until authentication status is resolved
    if (authLoading) return;

    // If no user, redirect to login page
    if (!user) {
      router.replace('/');
      return;
    }

    // Handle admin route protection
    if (isInsideAdmin) {
      // Wait until admin status is resolved
      if (adminLoading) return;
      
      // If user is not an admin, redirect
      if (!isAdmin) {
        router.replace('/admin-login');
      }
    }
  }, [user, authLoading, isAdmin, adminLoading, router, pathname, isInsideAdmin]);

  // Determine the combined loading state
  const isLoading = authLoading || (isInsideAdmin && adminLoading);

  if (isLoading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-background">
        <Card>
          <CardHeader>
            <CardTitle>Verifying Access...</CardTitle>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // If authenticated and authorized, render the children
  if (user && (!isInsideAdmin || isAdmin)) {
    return <>{children}</>;
  }

  // Render nothing while redirecting
  return null;
}
