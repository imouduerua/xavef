
'use client';

import React, { useEffect } from 'react';
import { useUser } from '@/firebase';
import { useRouter, usePathname } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppHeader } from "@/components/layout/header";
import { SidebarInset } from "@/components/ui/sidebar";
import { useAdminStatus } from '@/hooks/use-admin-status';


function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useUser();
  const { isAdmin, loading: adminLoading } = useAdminStatus();
  const router = useRouter();
  const pathname = usePathname();

  const isAuthPage = pathname === '/' || pathname === '/register' || pathname === '/admin-login';
  const isInsideAdmin = pathname.startsWith('/admin');
  
  useEffect(() => {
    // Wait for auth to be resolved.
    if (authLoading || adminLoading) return;

    // If no user and not on a public auth page, redirect to login.
    if (!user && !isAuthPage) {
      router.replace('/');
      return;
    }
    
    // If a user is logged in...
    if (user) {
      // If on an auth page, redirect away. Admins go to /admin, others to /dashboard.
      if (isAuthPage) {
          router.replace(isAdmin ? '/admin' : '/dashboard');
      } 
      // If trying to access an admin page but is not an admin, redirect to dashboard.
      else if (isInsideAdmin && !isAdmin) {
        router.replace('/dashboard');
      }
    }
  }, [user, authLoading, isAdmin, adminLoading, router, pathname, isAuthPage, isInsideAdmin]);

  const isLoading = authLoading || adminLoading;

  // While loading, show a skeleton on protected pages.
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
  
  // Render nothing while redirecting to prevent flicker.
  if ((!user && !isAuthPage) || (user && isAuthPage)) return null;
  if (isInsideAdmin && !isAdmin && !isLoading) return null; // also check for loading

  // If all checks pass, render the children.
  return <>{children}</>;
}


export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname === '/' || pathname === '/register' || pathname === '/admin-login';
  const { isAdmin, isSuperAdmin } = useAdminStatus();

  return (
    <AuthGuard>
      {isAuthPage ? (
        children
      ) : (
        <>
          <AppSidebar isAdmin={isAdmin} isSuperAdmin={isSuperAdmin} />
          <SidebarInset>
            <AppHeader />
            <main className="flex-1 overflow-y-auto">{children}</main>
          </SidebarInset>
        </>
      )}
    </AuthGuard>
  );
}
