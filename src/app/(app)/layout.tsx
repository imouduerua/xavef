
'use client';

import React, { useEffect } from 'react';
import { useUser } from '@/firebase/provider';
import { useAdminStatus } from '@/hooks/use-admin-status';
import { useRouter, usePathname } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppHeader } from "@/components/layout/header";
import { SidebarInset } from "@/components/ui/sidebar";

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useUser();
  const { isAdmin, loading: adminLoading } = useAdminStatus();
  const router = useRouter();
  const pathname = usePathname();

  const isAuthPage = pathname === '/' || pathname === '/register' || pathname === '/admin-login';
  const isInsideAdmin = pathname.startsWith('/admin');
  
  useEffect(() => {
    if (authLoading) return;

    if (!user && !isAuthPage) {
      router.replace('/');
      return;
    }

    if (user) {
      if (isAuthPage) {
        router.replace(isAdmin ? '/admin' : '/dashboard');
      } else if (isInsideAdmin && !adminLoading && !isAdmin) {
        router.replace('/dashboard');
      }
    }
  }, [user, authLoading, isAdmin, adminLoading, router, pathname, isAuthPage, isInsideAdmin]);

  const isLoading = authLoading || (isInsideAdmin && adminLoading);

  if (isLoading && !isAuthPage) {
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
  
  if (!user && !isAuthPage) return null;
  if (user && isAuthPage) return null;
  if (isInsideAdmin && !isAdmin && !adminLoading) return null;


  // Render children for authenticated users on non-auth pages,
  // or for unauthenticated users on auth pages.
  return <>{children}</>;
}


export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname === '/' || pathname === '/register' || pathname === '/admin-login';

  return (
    <AuthGuard>
      {isAuthPage ? (
        children
      ) : (
        <>
          <AppSidebar />
          <SidebarInset>
            <AppHeader />
            <main className="flex-1 overflow-y-auto">{children}</main>
          </SidebarInset>
        </>
      )}
    </AuthGuard>
  );
}
