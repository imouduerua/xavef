
'use client';

import { useAdminStatus } from '@/hooks/use-admin-status';
import { useRouter } from 'next/navigation';
import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Skeleton } from '../ui/skeleton';

export function SuperAdminAuthGuard({ children }: { children: React.ReactNode }) {
  const { isSuperAdmin, loading } = useAdminStatus();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isSuperAdmin) {
      router.replace('/admin'); // Redirect non-super-admins away
    }
  }, [isSuperAdmin, loading, router]);

  if (loading) {
    return (
        <div className="flex items-center justify-center min-h-screen">
            <Card>
                <CardHeader>
                    <CardTitle>Verifying Super Admin Status...</CardTitle>
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-8 w-full" />
                </CardContent>
            </Card>
        </div>
    );
  }

  if (isSuperAdmin) {
    return <>{children}</>;
  }

  // Render null while redirecting
  return null;
}
