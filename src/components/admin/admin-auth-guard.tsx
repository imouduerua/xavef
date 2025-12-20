'use client';

import { useAdminStatus } from '@/hooks/use-admin-status';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Skeleton } from '../ui/skeleton';

export function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const { isAdmin, loading } = useAdminStatus();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  // This ensures the effect runs only on the client after hydration
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    // Only perform the redirect logic on the client, after the initial render and once loading is complete.
    if (isClient && !loading && !isAdmin) {
      router.replace('/admin-login');
    }
  }, [isAdmin, loading, router, isClient]);

  // While loading or on the server, show a loading skeleton.
  if (loading || !isClient) {
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

  // If not an admin, render null to prevent flicker before redirect.
  if (!isAdmin) {
    return null;
  }

  // If an admin, render the children.
  return <>{children}</>;
}
