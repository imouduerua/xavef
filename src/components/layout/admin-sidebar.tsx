
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Banknote,
  Shield,
} from 'lucide-react';

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from '@/components/ui/sidebar';
import { XavefLogoText } from '@/components/icons';

const navItems = [
  { href: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { href: '/admin/users', icon: Users, label: 'Users' },
  { href: '/admin/transactions', icon: Banknote, label: 'Transactions' },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();

  const isActive = (href: string, exact = false) => {
    return exact ? pathname === href : pathname.startsWith(href);
  };
  
  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <Sidebar className="border-r" collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2">
            <XavefLogoText />
            <Shield className="h-5 w-5 text-muted-foreground" />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={isActive(item.href, item.exact)}
                icon={<item.icon />}
                tooltip={item.label}
              >
                <Link href={item.href} onClick={handleLinkClick}>{item.label}</Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
}
