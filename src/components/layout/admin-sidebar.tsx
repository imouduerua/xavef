'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Banknote,
  Shield,
  Clock,
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
  { href: '/admin/transactions', icon: Banknote, label: 'All Transactions' },
  { href: '/admin/transactions?tab=pending', icon: Clock, label: 'Pending Transactions' },
  { href: '/admin/management', icon: Shield, label: 'Management' },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isMobile, setOpenMobile } = useSidebar();

  const isActive = (href: string, exact = false) => {
    if (href === '/admin/transactions') {
      // "All Transactions" is active if we're on the transactions page, but not specifically on the "pending" tab.
      return pathname === '/admin/transactions' && searchParams.get('tab') !== 'pending';
    }
    if (href === '/admin/transactions?tab=pending') {
      return pathname === '/admin/transactions' && searchParams.get('tab') === 'pending';
    }

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
