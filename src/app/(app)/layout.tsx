import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppHeader } from "@/components/layout/header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { UserDataProvider } from "@/context/user-data-provider";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <UserDataProvider>
        <AppSidebar />
        <SidebarInset>
          <AppHeader />
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </SidebarInset>
      </UserDataProvider>
    </SidebarProvider>
  );
}
