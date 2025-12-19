"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowLeftRight,
  BrainCircuit,
  LayoutDashboard,
  LogOut,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { XavefLogo } from "@/components/icons";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { mockUser } from "@/lib/mock-data";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/transactions", icon: ArrowLeftRight, label: "Transactions" },
  { href: "/advice", icon: BrainCircuit, label: "AI Advice" },
];

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    router.push("/");
  };

  return (
    <Sidebar className="border-r" collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2">
          <XavefLogo className="h-8 w-8 text-sidebar-foreground" />
          <span className="text-lg font-semibold">XAVEF</span>
        </div>
        <SidebarTrigger className="hidden md:flex" />
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={pathname === item.href}
                icon={<item.icon />}
                tooltip={item.label}
              >
                <Link href={item.href}>{item.label}</Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <div className="flex items-center gap-3 p-2">
            <Avatar className="h-10 w-10">
                <AvatarImage src={mockUser.avatarUrl} alt={mockUser.name} />
                <AvatarFallback>{mockUser.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 overflow-hidden">
                <p className="font-semibold truncate">{mockUser.name}</p>
                <p className="text-xs text-muted-foreground truncate">{mockUser.email}</p>
            </div>
            <SidebarMenuButton variant="ghost" size="icon" className="h-8 w-8" onClick={handleLogout} tooltip="Logout">
                <LogOut size={16} />
            </SidebarMenuButton>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
