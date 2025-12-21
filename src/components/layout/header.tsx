
'use client';

import React, { useEffect, useState } from 'react';
import { ArrowLeft, Bell, LogOut, Moon, Sun, User as UserIcon, BadgePercent } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';

import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SidebarTrigger } from '../ui/sidebar';
import { useAuth, useUser } from '@/firebase';
import { toast } from '@/hooks/use-toast';
import { mockNotifications } from '@/lib/mock-data';
import { signOut } from 'firebase/auth';
import Link from 'next/link';
import { useUserData } from '@/hooks/use-user-data';
import { ReferralCodeDialog } from '../dashboard/referral-code-dialog';

export function AppHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const auth = useAuth();
  const { user } = useUser();
  const { userData } = useUserData();
  const unreadCount = mockNotifications.filter((n) => !n.read).length;
  const [isClient, setIsClient] = useState(false);
  const [theme, setTheme] = useState('light');

  const isDashboard = pathname === '/dashboard';


  useEffect(() => {
    setIsClient(true);
    const storedTheme = localStorage.getItem('theme') || 'light';
    setTheme(storedTheme);
    document.documentElement.classList.toggle('dark', storedTheme === 'dark');
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast({
        title: 'Logged Out',
        description: 'You have been successfully logged out.',
      });
      window.location.assign('/');
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Logout Failed',
        description: 'There was an error logging you out. Please try again.',
      });
    }
  };
  
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  return (
    <>
      <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-4 border-b bg-background px-4">
        <SidebarTrigger />
        {!isDashboard && (
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => router.back()}>
                <ArrowLeft />
                <span className="sr-only">Back</span>
            </Button>
        )}
        <div className="flex-1" />

        <div className="flex items-center gap-4">
          {isClient && (
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
          )}
          
          <Button variant="ghost" size="icon" onClick={toggleTheme}>
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>

          {isClient && user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                 <Avatar className="h-9 w-9 cursor-pointer">
                    <AvatarImage src={user?.photoURL ?? undefined} alt={user?.displayName ?? ''} />
                    <AvatarFallback>{user?.displayName?.charAt(0) ?? user?.email?.charAt(0)}</AvatarFallback>
                  </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user?.displayName}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/settings">
                    <UserIcon className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
                 {userData?.canGenerateReferralCode && (
                  <ReferralCodeDialog>
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                      <BadgePercent className="mr-2 h-4 w-4" />
                      <span>Generate Referral Code</span>
                    </DropdownMenuItem>
                  </ReferralCodeDialog>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </header>
    </>
  );
}
