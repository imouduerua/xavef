
'use client';

import { useMemo } from 'react';
import { useUser, useFirestore } from '@/firebase/provider';
import { useDoc } from '@/firebase/firestore/use-collection';
import { doc } from 'firebase/firestore';

export function useAdminStatus() {
  const { user, loading: authLoading } = useUser();
  const firestore = useFirestore();

  // Super admin is a hardcoded email for top-level access.
  const isSuperAdmin = user?.email === 'admin@xavef.com';

  // The document reference to check for regular admin status.
  // Memoized to prevent re-creating the reference on every render.
  const adminDocRef = useMemo(() => {
    // Don't bother checking if the user isn't logged in, or if they're already a super admin.
    if (!user?.uid || isSuperAdmin) return null;
    return doc(firestore, 'admins', user.uid);
  }, [user?.uid, isSuperAdmin, firestore]);

  // The useDoc hook listens to the admin document.
  // Its `loading` state will be true until the check is complete.
  const { data: adminData, loading: docLoading } = useDoc<{ isAdmin: boolean }>(adminDocRef);

  // The final result is memoized for stability.
  const result = useMemo(() => {
    const regularAdmin = !!adminData; // Is the user in the 'admins' collection?
    const isAdmin = isSuperAdmin || regularAdmin;
    
    // The overall loading state is true if auth is loading OR
    // if we are logged in and not a super admin, and the admin doc is still loading.
    const loading = authLoading || (!isSuperAdmin && !!user && docLoading);

    return { isAdmin, isSuperAdmin, loading };
  }, [isSuperAdmin, adminData, authLoading, docLoading, user]);

  return result;
}

    