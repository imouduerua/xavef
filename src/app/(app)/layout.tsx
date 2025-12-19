
'use client';

import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppHeader } from "@/components/layout/header";
import { SidebarProvider, useSidebar, SidebarInset } from "@/components/ui/sidebar";
import { UserDataProvider } from "@/context/user-data-provider";
import { cn } from "@/lib/utils";

function AppLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const { state, isMobile } = useSidebar();
  
  return (
    <>
      <AppSidebar />
      <SidebarInset>
        <AppHeader />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </SidebarInset>
    </>
  );
}


export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <UserDataProvider>
        <AppLayoutContent>{children}</AppLayoutContent>
      </UserDataProvider>
    </SidebarProvider>
  );
}
