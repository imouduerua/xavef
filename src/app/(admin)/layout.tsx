
'use client';

import React, 'react';
import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AdminSidebar } from '@/components/admin/admin-sidebar';
import { AdminHeader } from "@/components/admin/admin-header";
import { SidebarInset } from "@/components/ui/sidebar";
import { useAdminStatus } from '@/hooks/use-admin-status';


function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useUser();
  const { isAdmin, loading: adminLoading } = useAdminStatus();
  const router = useRouter();

  const isLoading = authLoading || adminLoading;

  React.useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.replace('/admin-login');
      return;
    }
    
    if (user && !isAdmin) {
      router.replace('/dashboard');
    }

  }, [user, isAdmin, isLoading, router]);

  if (isLoading || !user || !isAdmin) {
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
  
  return <>{children}</>;
}


export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminAuthGuard>
      <AdminSidebar />
      <SidebarInset>
        <AdminHeader />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </SidebarInset>
    </AdminAuthGuard>
  );
}
