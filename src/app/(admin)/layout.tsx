
'use client';

import { AppHeader } from "@/components/layout/header";
import { SidebarProvider, useSidebar, SidebarInset } from "@/components/ui/sidebar";
import { UserDataProvider } from "@/context/user-data-provider";
import { AdminAuthGuard } from "@/components/admin/admin-auth-guard";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { cn } from "@/lib/utils";


function AdminLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const { state, isMobile } = useSidebar();

  return (
    <AdminAuthGuard>
      <AdminSidebar />
       <SidebarInset>
        <AppHeader />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </SidebarInset>
    </AdminAuthGuard>
  );
}


export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <UserDataProvider>
        <AdminLayoutContent>
           {children}
        </AdminLayoutContent>
      </UserDataProvider>
    </SidebarProvider>
  );
}
