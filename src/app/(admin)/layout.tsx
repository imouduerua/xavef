
'use client';

import React, { useEffect } from 'react';
import { useUser } from '@/firebase';
import { useRouter, usePathname } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAdmin } from '@/hooks/use-admin';
import { AdminSidebar } from '@/components/layout/admin-sidebar';
import { SidebarInset } from '@/components/ui/sidebar';
import { AdminHeader } from '@/components/layout/admin-header';
import { FCMInitializer } from '@/components/admin/fcm-initializer';

function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useUser();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const router = useRouter();
  const pathname = usePathname();

  const isAuthPage = pathname === '/admin-login';
  
  useEffect(() => {
    const totalLoading = authLoading || adminLoading;
    if (totalLoading) return;

    if (!user && !isAuthPage) {
      router.replace('/admin-login');
      return;
    }

    if (user) {
      if (isAuthPage) {
        router.replace(isAdmin ? '/admin' : '/dashboard');
      } else if (!isAdmin) {
        router.replace('/dashboard');
      }
    }
  }, [user, authLoading, isAdmin, adminLoading, router, pathname, isAuthPage]);

  const isLoading = authLoading || adminLoading;

  if (isLoading && !isAuthPage) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-background">
        <Card>
          <CardHeader>
            <CardTitle>Verifying Admin Access...</CardTitle>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Prevent flicker during redirects or when access is denied
  if ((!user && !isAuthPage) || (user && !isAdmin && !isAuthPage)) {
    return null;
  }
  
  return <>{children}</>;
}


export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname === '/admin-login';

  if (isAuthPage) {
    return <AdminAuthGuard>{children}</AdminAuthGuard>;
  }

  return (
    <AdminAuthGuard>
      <FCMInitializer />
      <AdminSidebar />
      <SidebarInset>
        <AdminHeader />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </SidebarInset>
    </AdminAuthGuard>
  );
}
