
'use client';
import { useUser } from '@/firebase';

export function useAdmin() {
  const { user, loading: authLoading } = useUser();
  
  // Hardcode the admin check to a specific email address
  const isAdmin = user?.email === 'admin@xavef.com';
  
  // The loading state is now only dependent on the authentication status
  const loading = authLoading;

  return { isAdmin, loading };
}
