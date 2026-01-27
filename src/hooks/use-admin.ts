'use client';
import { useUser } from '@/firebase';

/**
 * This hook checks if the currently logged-in user is an administrator.
 * To unblock admin access, this has been temporarily simplified to only
 * check for the hardcoded super admin email.
 */
export function useAdmin() {
  const { user, loading: authLoading } = useUser();

  // For now, only the hardcoded admin email is considered an admin.
  // This bypasses any Firestore-related authentication issues.
  const isAdmin = user?.email === 'admin@xavef.com';
  
  // The loading state now only depends on the authentication status.
  const loading = authLoading;

  return { isAdmin, loading };
}
