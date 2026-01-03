
'use client';

import { useDoc } from '@/firebase/firestore/use-doc';
import { useFirestore, useUser } from '@/firebase/provider';
import { doc } from 'firebase/firestore';
import React, { useMemo } from 'react';

type AdminData = {
  isAdmin: boolean;
};

export function useAdminStatus() {
  const { user, loading: authLoading } = useUser();
  const isSuperAdmin = user?.email === 'admin@xavef.com';
  const firestore = useFirestore();

  const adminDocRef = useMemo(() => {
    if (!user?.uid || isSuperAdmin) {
      return null;
    }
    return doc(firestore, 'admins', user.uid);
  }, [user?.uid, isSuperAdmin, firestore]);

  const { data: adminData, loading: docLoading } = useDoc<AdminData>(adminDocRef);

  return useMemo(() => {
    const regularAdmin = !!adminData;
    const isAdmin = isSuperAdmin || regularAdmin;
    const loading = authLoading || (!isSuperAdmin && !!user && docLoading);

    return { isAdmin, isSuperAdmin, loading };
  }, [isSuperAdmin, adminData, authLoading, docLoading, user]);
}
