
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Landmark,
  LayoutDashboard,
  LogOut,
  PiggyBank,
  Settings,
  Users,
  Wallet,
  BrainCircuit,
  Shield,
  History,
  Clock,
} from 'lucide-react';

import { useUser } from '@/firebase';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';


const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/savings', icon: PiggyBank, label: 'Savings' },
  { href: '/groups', icon: Users, label: 'Groups' },
  { href: '/loans', icon: Landmark, label: 'Loans' },
  { href: '/withdrawal', icon: Wallet, label: 'Withdrawal' },
  { href: '/advice', icon: BrainCircuit, label: 'AI Advisor' },
];

const adminNavItems = [
  { href: '/admin', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { href: '/admin/users', icon: Users, label: 'User Management' },
  { href: '/admin/groups', icon: Users, label: 'Group Management' },
  { href: '/admin/pending-transactions', icon: Clock, label: 'Pending Transactions' },
  { href: '/admin/transactions', icon: History, label: 'All Transactions', superAdminOnly: true },
];

const bottomNavItems = [{ href: '/settings', icon: Settings, label: 'Settings' }];

interface AppSidebarProps {
    isAdmin: boolean;
    isSuperAdmin: boolean;
}

export function AppSidebar({ isAdmin, isSuperAdmin }: AppSidebarProps) {
  const pathname = usePathname();
  const { user } = useUser();
  const { isMobile, setOpenMobile } = useSidebar();

  const isInsideAdmin = pathname.startsWith('/admin');

  const currentNavItems = isInsideAdmin
    ? adminNavItems.filter(item => !item.superAdminOnly || isSuperAdmin)
    : navItems;

  const isActive = (href: string, exact = false) => {
    if (exact) {
      return pathname === href;
    }
     if (href === '/admin/groups') {
        return pathname.startsWith('/admin/groups') || pathname.startsWith('/admin/group-details');
    }
    if (href === '/admin/users') {
        return pathname.startsWith('/admin/users');
    }
    return pathname.startsWith(href);
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
          {currentNavItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={isActive(item.href, (item as any).exact)}
                icon={<item.icon />}
                tooltip={item.label}
              >
                <Link href={item.href} onClick={handleLinkClick}>{item.label}</Link>
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
                    <Link href="/admin" onClick={handleLinkClick}>Admin Panel</Link>
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
                <Link href={item.href} onClick={handleLinkClick}>{item.label}</Link>
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
