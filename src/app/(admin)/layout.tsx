
'use client';

import { AppHeader } from "@/components/layout/header";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AdminAuthGuard } from "@/components/admin/admin-auth-guard";
import { AppSidebar } from "@/components/layout/app-sidebar";

function AdminLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {

  return (
    <AdminAuthGuard>
      <AppSidebar />
      <main className="flex flex-1 flex-col">
        <AppHeader />
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </main>
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
      <AdminLayoutContent>
          {children}
      </AdminLayoutContent>
    </SidebarProvider>
  );
}
