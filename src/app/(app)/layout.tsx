import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppHeader } from "@/components/layout/header";
import { SidebarProvider } from "@/components/ui/sidebar";
import { UserDataProvider } from "@/context/user-data-provider";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <UserDataProvider>
        <div className="flex min-h-screen bg-background">
          <AppSidebar />
          <main className="flex-1 flex flex-col">
              <AppHeader />
              <div className="flex-1">
              {children}
              </div>
          </main>
        </div>
      </UserDataProvider>
    </SidebarProvider>
  );
}
