
'use client';

import { useDoc } from '@/firebase/firestore/use-doc';
import { getFirebase } from '@/firebase';
import { useAuthContext } from '@/context/auth-context';
import { doc } from 'firebase/firestore';
import React, { useMemo } from 'react';

type AdminData = {
  isAdmin: boolean;
};

export function useAdminStatus() {
  const { user, loading: authLoading } = useAuthContext();
  const isSuperAdmin = user?.email === 'admin@xavef.com';

  const adminDocRef = useMemo(() => {
    if (!user?.uid || isSuperAdmin) {
      return null;
    }
    const { firestore } = getFirebase();
    return doc(firestore, 'admins', user.uid);
  }, [user?.uid, isSuperAdmin]);

  const { data: adminData, loading: docLoading } = useDoc<AdminData>(adminDocRef);

  return useMemo(() => {
    const regularAdmin = !!adminData;
    const isAdmin = isSuperAdmin || regularAdmin;
    const loading = authLoading || (!isSuperAdmin && !!user && docLoading);

    return { isAdmin, isSuperAdmin, loading };
  }, [isSuperAdmin, adminData, authLoading, docLoading, user]);
}
