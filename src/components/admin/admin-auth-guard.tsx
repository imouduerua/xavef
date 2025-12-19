'use client';

import { useAdminStatus } from '@/hooks/use-admin-status';
import { useRouter } from 'next/navigation';
import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Skeleton } from '../ui/skeleton';

export function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const { isAdmin, loading } = useAdminStatus();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAdmin) {
      router.replace('/admin-login');
    }
  }, [isAdmin, loading, router]);

  if (loading) {
    return (
        <div className="flex items-center justify-center min-h-screen">
            <Card>
                <CardHeader>
                    <CardTitle>Verifying Admin Status...</CardTitle>
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-8 w-full" />
                </CardContent>
            </Card>
        </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return <>{children}</>;
}
