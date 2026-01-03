
'use client';

import { AppHeader } from "@/components/layout/header";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { useAdminStatus } from "@/hooks/use-admin-status";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAdmin, loading } = useAdminStatus();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAdmin) {
      router.replace('/admin-login');
    }
  }, [isAdmin, loading, router]);

  if (loading) {
    return (
        <div className="flex items-center justify-center min-h-screen w-full bg-background">
            <Card>
                <CardHeader>
                    <CardTitle>Verifying Admin Privileges...</CardTitle>
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-8 w-full" />
                </CardContent>
            </Card>
        </div>
    );
  }

  // If authenticated and is an admin, render the full layout with children.
  // Otherwise, the effect will have already triggered a redirect, so we render null.
  if (isAdmin) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <main className="flex flex-1 flex-col">
          <AppHeader />
          <div className="flex-1 overflow-y-auto">
            {children}
          </div>
        </main>
      </SidebarProvider>
    );
  }

  // Render null while redirecting to prevent flashing content
  return null;
}
