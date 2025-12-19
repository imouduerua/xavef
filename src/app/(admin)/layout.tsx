import { AppHeader } from "@/components/layout/header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { UserDataProvider } from "@/context/user-data-provider";
import { AdminAuthGuard } from "@/components/admin/admin-auth-guard";
import { AdminSidebar } from "@/components/admin/admin-sidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <UserDataProvider>
        <AdminAuthGuard>
          <AdminSidebar />
          <SidebarInset>
            <AppHeader />
            <main className="flex-1 overflow-y-auto">
              {children}
            </main>
          </SidebarInset>
        </AdminAuthGuard>
      </UserDataProvider>
    </SidebarProvider>
  );
}
