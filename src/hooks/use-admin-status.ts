
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

  const isSuperAdmin = useMemo(() => user?.email === 'admin@xavef.com', [user?.email]);

  const adminDocRef = useMemo(() => {
    return (user?.uid && !isSuperAdmin && firestore) 
      ? doc(firestore, 'admins', user.uid)
      : null;
  }, [user?.uid, isSuperAdmin, firestore]);

  const { data: adminData, loading: docLoading } = useDoc<AdminData>(adminDocRef);

  // An admin is either the super admin or is marked as an admin in the database.
  const isAdmin = useMemo(() => isSuperAdmin || adminData?.isAdmin === true, [isSuperAdmin, adminData]);

  // Loading is complete when user loading is done, AND if we need to check the doc, doc loading is also done.
  const loading = useMemo(() => authLoading || (!!user && !isSuperAdmin ? docLoading : false), [authLoading, user, isSuperAdmin, docLoading]);


  return { isAdmin, isSuperAdmin, loading };
}
