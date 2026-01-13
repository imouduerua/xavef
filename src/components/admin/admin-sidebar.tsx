
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  History,
  Activity,
  Hourglass,
} from 'lucide-react';

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import { XavefLogoText } from '@/components/icons';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { useUser } from '@/firebase';
import { useAdminStatus } from '@/hooks/use-admin-status';

const navItems = [
  { href: '/admin', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { href: '/admin/pending-transactions', icon: Hourglass, label: 'Pending Transactions' },
  { href: '/admin/users', icon: Users, label: 'User Management' },
  { href: '/admin/groups', icon: Activity, label: 'Group Management' },
];


export function AdminSidebar() {
  const pathname = usePathname();
  const { user } = useUser();
  const { isSuperAdmin } = useAdminStatus();
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
        <XavefLogoText />
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
           {isSuperAdmin && (
             <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={isActive('/admin/transactions')}
                icon={<History />}
                tooltip="All Transactions"
              >
                <Link href="/admin/transactions" onClick={handleLinkClick}>All Transactions</Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
           )}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="flex-col !items-start !gap-0">
        <div className="mt-4 flex items-center gap-3 p-2">
          <Avatar className="h-10 w-10">
            <AvatarImage
              src={user?.photoURL ?? undefined}
              alt={user?.displayName ?? ''}
            />
            <AvatarFallback>
              {user?.displayName?.charAt(0) ?? user?.email?.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 overflow-hidden">
            <p className="truncate font-semibold">{user?.displayName}</p>
            <p className="truncate text-xs text-muted-foreground">
              {user?.email}
            </p>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
