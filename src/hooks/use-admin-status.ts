
'use client';

import { useMemo } from 'react';
import { useUser, useFirestore } from '@/firebase/provider';
import { useDoc } from '@/firebase/firestore/use-collection';
import { doc } from 'firebase/firestore';

export function useAdminStatus() {
  const { user, loading: authLoading } = useUser();
  const firestore = useFirestore();

  const isSuperAdmin = user?.email === 'admin@xavef.com';

  const adminDocRef = useMemo(() => {
    if (!user?.uid || isSuperAdmin || !firestore) return null;
    return doc(firestore, 'admins', user.uid);
  }, [user?.uid, isSuperAdmin, firestore]);

  const { data: adminData, loading: docLoading } = useDoc<{ isAdmin: boolean }>(adminDocRef);

  const result = useMemo(() => {
    const regularAdmin = !!adminData;
    const isAdmin = isSuperAdmin || regularAdmin;
    
    const loading = authLoading || (!isSuperAdmin && !!user && docLoading);

    return { isAdmin, isSuperAdmin, loading };
  }, [isSuperAdmin, adminData, authLoading, docLoading, user]);

  return result;
}
