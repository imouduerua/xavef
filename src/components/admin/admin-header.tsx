
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { LogOut, Moon, Sun, Users } from 'lucide-react';
import Link from 'next/link';

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
import { useAuth, useUser } from '@/firebase';
import { toast } from '@/hooks/use-toast';
import { signOut } from 'firebase/auth';

export function AdminHeader() {
  const { user } = useUser();
  const auth = useAuth();

  const [isClient, setIsClient] = useState(false);
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    setIsClient(true);
    const storedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(storedTheme);
    document.documentElement.classList.toggle('dark', storedTheme === 'dark');
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      // First, sign out from the client-side Firebase Auth
      await signOut(auth);
      
      // Then, call our API endpoint to clear the server-side session cookie
      const response = await fetch('/api/auth/session', { method: 'DELETE' });

      if (!response.ok) {
        throw new Error('Failed to clear server session.');
      }

      toast({
        title: 'Logged Out',
        description: 'You have been successfully logged out.',
      });

      // Use window.location.href for a full page reload to ensure server state is cleared
      window.location.href = '/admin-login';
    } catch (error) {
      console.error('Logout failed:', error);
      toast({
        variant: 'destructive',
        title: 'Logout Failed',
        description: 'There was an error logging you out. Please try again.',
      });
    }
  }, [auth]);
  
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  return (
    <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-4 border-b bg-background px-4">
      <SidebarTrigger />
      <div className="flex-1">
        <h1 className="text-lg font-semibold">Admin Portal</h1>
      </div>

      <div className="flex items-center gap-4">
        {isClient && (
          <Button variant="ghost" size="icon" onClick={toggleTheme}>
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>
        )}

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
                <Link href="/dashboard">
                  <Users className="mr-2 h-4 w-4" />
                  <span>Switch to User View</span>
                </Link>
              </DropdownMenuItem>
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
