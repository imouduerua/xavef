import { AppHeader } from "@/components/layout/header";
import { SidebarProvider } from "@/components/ui/sidebar";
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
          <div className="flex min-h-screen bg-background">
            <AdminSidebar />
            <div className="flex-1 flex flex-col w-full">
              <AppHeader />
              <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                {children}
              </main>
            </div>
          </div>
        </AdminAuthGuard>
      </UserDataProvider>
    </SidebarProvider>
  );
}
