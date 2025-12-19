"use client";

import {
  Bell,
} from "lucide-react";
import { usePathname } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { mockNotifications } from "@/lib/mock-data";

const pathToTitle: { [key: string]: string } = {
  "/dashboard": "Dashboard",
  "/transactions": "Transactions",
  "/advice": "AI Financial Advisor",
};

export function AppHeader() {
  const pathname = usePathname();
  const unreadCount = mockNotifications.filter((n) => !n.read).length;

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
       <div className="md:hidden">
          <SidebarTrigger />
       </div>
      <h1 className="flex-1 text-xl font-semibold tracking-tight">
        {pathToTitle[pathname] || "XAVEF Financials"}
      </h1>
      <div className="flex items-center gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 justify-center p-0">{unreadCount}</Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {mockNotifications.map((notification) => (
              <DropdownMenuItem key={notification.id} className="flex flex-col items-start gap-1">
                <div className="flex w-full items-center">
                    <p className={`flex-1 font-medium ${notification.read ? '' : 'font-bold'}`}>{notification.title}</p>
                    {!notification.read && <div className="h-2 w-2 rounded-full bg-primary ml-2" />}
                </div>
                <p className="text-xs text-muted-foreground">{notification.description}</p>
                <p className="text-xs text-muted-foreground/70">{new Date(notification.date).toLocaleDateString()}</p>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
