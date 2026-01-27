'use client';
import { useUser } from '@/firebase';

/**
 * This hook is used in the main application layout to determine if a logged-in
 * user has admin privileges. This is used to control access and UI elements
 * for users who might also be admins.
 * To unblock admin access, this has been temporarily simplified to only
 * check for the hardcoded super admin email.
 */
export function useAdminStatus() {
  const { user, loading: authLoading } = useUser();

  // For now, only the hardcoded admin email is considered an admin.
  const isAdmin = user?.email === 'admin@xavef.com';
  
  // The loading state now only depends on the authentication status.
  const loading = authLoading;

  return { isAdmin, loading };
}
