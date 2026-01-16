
'use client';

import React, { useState, useEffect } from 'react';
import { LogOut, LayoutDashboard, User as UserIcon, Moon, Sun, Bell } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { collection, query, orderBy, limit } from 'firebase/firestore';

import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
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
import { useUser, useAuth, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { toast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Badge } from '../ui/badge';
import { Skeleton } from '../ui/skeleton';
import type { Notification } from '@/lib/types';


const formatDate = (date: any) => {
    if (!date) return '';
    const d = date.toDate ? date.toDate() : new Date(date);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString();
};

export function AdminHeader() {
  const router = useRouter();
  const { user } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  
  const [theme, setTheme] = useState('dark');

  const notificationsQuery = useMemoFirebase(() => (user?.uid && firestore) ? query(
      collection(firestore, `users/${user.uid}/notifications`),
      orderBy('createdAt', 'desc'),
      limit(10)
    ) : null, [user?.uid, firestore]);
    
  const { data: notifications, loading: notificationsLoading } = useCollection<Notification>(notificationsQuery);
  
  const unreadCount = notifications?.filter((n) => !n.read).length;


  useEffect(() => {
    const storedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(storedTheme);
    document.documentElement.classList.toggle('dark', storedTheme === 'dark');
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  const handleLogout = async () => {
    if (!auth) return;
    try {
      await signOut(auth);
      toast({
        title: 'Logged Out',
        description: 'You have been successfully logged out.',
      });
      router.push('/');
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Logout Failed',
        description: 'There was an error logging you out. Please try again.',
      });
    }
  };

  return (
    <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-4 border-b bg-background px-4">
      <SidebarTrigger />
      <div className="flex-1" />
      <div className="flex items-center gap-4">
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                {notificationsLoading ? (
                    <Skeleton className="h-5 w-5" />
                ) : (
                    <>
                    <Bell className="h-5 w-5" />
                    {unreadCount && unreadCount > 0 && (
                        <Badge className="absolute -top-1 -right-1 h-5 w-5 justify-center p-0">{unreadCount}</Badge>
                    )}
                    </>
                )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {notifications && notifications.length > 0 ? notifications.map((notification) => (
                <DropdownMenuItem key={notification.id} asChild className="flex flex-col items-start gap-1 cursor-pointer">
                    <Link href={notification.actionUrl || '#'}>
                    <div className="flex w-full items-center">
                        <p className={`flex-1 font-medium ${notification.read ? '' : 'font-bold'}`}>{notification.title}</p>
                        {!notification.read && <div className="h-2 w-2 rounded-full bg-primary ml-2" />}
                    </div>
                    <p className="text-xs text-muted-foreground">{notification.description}</p>
                    <p className="text-xs text-muted-foreground/70">{formatDate(notification.createdAt)}</p>
                    </Link>
                </DropdownMenuItem>
                )) : (
                    <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                        You have no new notifications.
                    </div>
                )}
            </DropdownMenuContent>
        </DropdownMenu>

        <Button variant="ghost" size="icon" onClick={toggleTheme}>
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
        </Button>

        {user && (
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
                  <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/dashboard">
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  <span>Switch to User View</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings">
                  <UserIcon className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </Link>
              </DropdownMenuItem>
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
  );
}
