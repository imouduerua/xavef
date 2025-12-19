
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Landmark,
  LayoutDashboard,
  LogOut,
  PiggyBank,
  Settings,
  Users,
  Wallet,
  BookOpen,
  BrainCircuit,
  Shield,
  PanelLeft,
} from 'lucide-react';
import { signOut } from 'firebase/auth';

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { XavefLogoText } from '@/components/icons';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { useAuth, useUser } from '@/firebase';
import { toast } from '@/hooks/use-toast';
import { useAdminStatus } from '@/hooks/use-admin-status';
import { useMemo } from 'react';

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/transactions', icon: BookOpen, label: 'Transactions' },
  { href: '/savings', icon: PiggyBank, label: 'Savings' },
  { href: '/groups', icon: Users, label: 'Groups' },
  { href: '/loans', icon: Landmark, label: 'Loans' },
  { href: '/withdrawal', icon: Wallet, label: 'Withdrawal' },
  { href: '/advice', icon: BrainCircuit, label: 'Advice' },
];

const bottomNavItems = [{ href: '/settings', icon: Settings, label: 'Settings' }];

export function AppSidebar() {
  const pathname = usePathname();
  const { user } = useUser();
  const { isAdmin } = useAdminStatus();

  const currentNavItems = useMemo(() => {
    if (pathname.startsWith('/admin')) {
      return [
        { href: '/admin', icon: LayoutDashboard, label: 'Dashboard', exact: true },
        { href: '/admin/users', icon: Users, label: 'User Management' },
      ];
    }
    return navItems;
  }, [pathname]);

  const isActive = (href: string, exact = false) => {
    return exact ? pathname === href : pathname.startsWith(href);
  };
  
  const isInsideAdmin = pathname.startsWith('/admin');

  return (
    <Sidebar className="border-r" collapsible="icon">
      <SidebarHeader>
        <XavefLogoText />
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {currentNavItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={isActive(item.href, (item as any).exact)}
                icon={<item.icon />}
                tooltip={item.label}
              >
                <Link href={item.href}>{item.label}</Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
           {!isInsideAdmin && isAdmin && (
             <SidebarMenuItem>
                <SidebarMenuButton
                    asChild
                    isActive={pathname.startsWith('/admin')}
                    icon={<Shield />}
                    tooltip="Admin Panel"
                >
                    <Link href="/admin">Admin Panel</Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
          )}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="flex-col !items-start !gap-0">
        <SidebarMenu>
          {bottomNavItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={pathname.startsWith(item.href)}
                icon={<item.icon />}
                tooltip={item.label}
              >
                <Link href={item.href}>{item.label}</Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>

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
