
'use client';

import { AppHeader } from "@/components/layout/header";
import { SidebarProvider } from "@/components/ui/sidebar";
import { UserDataProvider } from "@/context/user-data-provider";
import { AdminAuthGuard } from "@/components/admin/admin-auth-guard";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { useFCM } from "@/hooks/use-fcm";

function AdminLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  // Initialize FCM for admin users
  useFCM();

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
      <UserDataProvider>
        <AdminLayoutContent>
           {children}
        </AdminLayoutContent>
      </UserDataProvider>
    </SidebarProvider>
  );
}
