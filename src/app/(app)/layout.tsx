
'use client';

import React, { useEffect, useMemo } from 'react';
import { useUser, useFirestore } from '@/firebase/provider';
import { useDoc } from '@/firebase/firestore/use-collection';
import { useRouter, usePathname } from 'next/navigation';
import { doc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppHeader } from "@/components/layout/header";
import { SidebarInset } from "@/components/ui/sidebar";

// This is a new, local implementation of the admin status logic.
function useAdminStatusCheck() {
  const { user, loading: authLoading } = useUser();
  const firestore = useFirestore();

  const isSuperAdmin = user?.email === 'admin@xavef.com';

  const adminDocRef = useMemo(() => {
    if (!user?.uid || isSuperAdmin) return null;
    return doc(firestore, 'admins', user.uid);
  }, [user?.uid, isSuperAdmin, firestore]);

  const { data: adminData, loading: docLoading } = useDoc<{ isAdmin: boolean }>(adminDocRef);

  const result = useMemo(() => {
    const regularAdmin = !!adminData;
    const isAdmin = isSuperAdmin || regularAdmin;
    const loading = authLoading || (!isSuperAdmin && !!user && docLoading);
    return { isAdmin, isSuperAdmin, loading };
  }, [isSuperAdmin, adminData, authLoading, docLoading, user]);

  return result;
}


function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useUser();
  const { isAdmin, loading: adminLoading } = useAdminStatusCheck();
  const router = useRouter();
  const pathname = usePathname();

  const isAuthPage = pathname === '/' || pathname === '/register' || pathname === '/admin-login';
  const isInsideAdmin = pathname.startsWith('/admin');
  
  useEffect(() => {
    // Wait for auth to be resolved.
    if (authLoading) return;

    // If no user and not on a public auth page, redirect to login.
    if (!user && !isAuthPage) {
      router.replace('/');
      return;
    }
    
    // If a user is logged in...
    if (user) {
      // If on an auth page, redirect away. Admins go to /admin, others to /dashboard.
      if (isAuthPage) {
        if (!adminLoading) { // wait for admin status to redirect correctly
          router.replace(isAdmin ? '/admin' : '/dashboard');
        }
      } 
      // If trying to access an admin page but is not an admin, redirect to dashboard.
      else if (isInsideAdmin && !adminLoading && !isAdmin) {
        router.replace('/dashboard');
      }
    }
  }, [user, authLoading, isAdmin, adminLoading, router, pathname, isAuthPage, isInsideAdmin]);

  const isLoading = authLoading || (user && isInsideAdmin && adminLoading);

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
  if (!user && !isAuthPage) return null;
  if (user && isAuthPage) return null;
  if (isInsideAdmin && !isAdmin && !adminLoading) return null;

  // If all checks pass, render the children.
  return <>{children}</>;
}


export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname === '/' || pathname === '/register' || pathname === '/admin-login';
  const { isAdmin, isSuperAdmin } = useAdminStatusCheck();

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

    