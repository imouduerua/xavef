
'use client';

import { useDoc, useFirestore } from '@/firebase';
import { useAuthContext } from '@/context/auth-context';
import { doc } from 'firebase/firestore';
import React, { useMemo } from 'react';

type AdminData = {
  isAdmin: boolean;
};

/**
 * Checks if the current user has admin or super-admin privileges.
 *
 * @returns An object with `isAdmin`, `isSuperAdmin`, and `loading` properties.
 *          The returned object is memoized to prevent unnecessary re-renders.
 */
export function useAdminStatus() {
  const { user, loading: authLoading } = useAuthContext();
  const firestore = useFirestore();

  // Determine super admin status based on a hardcoded email.
  const isSuperAdmin = user?.email === 'admin@xavef.com';

  // Only query the 'admins' collection if the user is authenticated and not the super admin.
  const adminDocRef = useMemo(() => {
    if (!user?.uid || isSuperAdmin || !firestore) {
      return null;
    }
    return doc(firestore, 'admins', user.uid);
  }, [user?.uid, isSuperAdmin, firestore]);

  const { data: adminData, loading: docLoading } = useDoc<AdminData>(adminDocRef);

  // Memoize the entire return object. This is the critical fix.
  // This hook will now only return a new object reference when the actual values
  // of isAdmin, isSuperAdmin, or loading change, breaking the infinite render loop.
  return useMemo(() => {
    const regularAdmin = !!adminData;
    const isAdmin = isSuperAdmin || regularAdmin;
    
    // The overall loading state is true if auth is loading, or if we are waiting for the admin doc check.
    const loading = authLoading || (!isSuperAdmin && !!user && docLoading);

    return { isAdmin, isSuperAdmin, loading };
  }, [isSuperAdmin, adminData, authLoading, docLoading, user]);
}
