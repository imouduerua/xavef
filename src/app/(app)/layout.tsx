
'use client';

import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppHeader } from "@/components/layout/header";
import { SidebarProvider, useSidebar } from "@/components/ui/sidebar";
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
      <div
        className={cn(
          "flex min-h-0 flex-1 flex-col transition-[margin-left] duration-200 ease-linear",
          !isMobile && state === 'expanded' && "ml-[16rem]",
        )}
      >
        <AppHeader />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
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
