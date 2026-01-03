
'use client';

import { useDoc, useFirestore } from '@/firebase';
import { useAuthContext } from '@/context/auth-context';
import { doc } from 'firebase/firestore';
import React, { useMemo } from 'react';

type AdminData = {
  isAdmin: boolean;
};

export function useAdminStatus() {
  const { user, loading: authLoading } = useAuthContext();
  const firestore = useFirestore();

  // The super admin email is a hardcoded business rule.
  const isSuperAdmin = useMemo(() => user?.email === 'admin@xavef.com', [user?.email]);

  const adminDocRef = useMemo(() => {
    // We only need to check the admins collection if the user is not the super admin
    if (!user?.uid || isSuperAdmin || !firestore) {
        return null;
    }
    return doc(firestore, 'admins', user.uid);
  }, [user?.uid, isSuperAdmin, firestore]);

  const { data: adminData, loading: docLoading } = useDoc<AdminData>(adminDocRef);
  
  // An admin is either the super admin or a user whose UID is in the admins collection.
  const isAdmin = useMemo(() => isSuperAdmin || !!adminData, [isSuperAdmin, adminData]);

  // The overall loading state depends on auth loading. If auth is done,
  // and we need to check the doc (i.e., user is not super admin), we also wait for doc loading.
  const loading = authLoading || (!!user && !isSuperAdmin ? docLoading : false);

  return { isAdmin, isSuperAdmin, loading };
}
