import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppHeader } from "@/components/layout/header";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { UserDataProvider } from "@/context/user-data-provider";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <UserDataProvider>
        <div className="min-h-screen bg-background">
          <AppSidebar />
          <div className="w-full">
            <AppHeader />
            <main>{children}</main>
          </div>
        </div>
      </UserDataProvider>
    </SidebarProvider>
  );
}
