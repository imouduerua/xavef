
'use client';

import { AppHeader } from "@/components/layout/header";
import { SidebarProvider, useSidebar } from "@/components/ui/sidebar";
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
      <div
        className={cn(
          "flex-1 flex flex-col transition-[margin-left] duration-300 ease-in-out",
          !isMobile && state === 'expanded' ? "ml-64" : "ml-0"
        )}
      >
        <AppHeader />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
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
