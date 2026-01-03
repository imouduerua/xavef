
'use client';

import { useDoc, useFirestore } from '@/firebase';
import { useAuthContext } from '@/context/auth-context';
import { doc } from 'firebase/firestore';
import React, { useMemo, useState, useEffect } from 'react';

type AdminData = {
  isAdmin: boolean;
};

export function useAdminStatus() {
  const { user, loading: authLoading } = useAuthContext();
  const firestore = useFirestore();

  const isSuperAdmin = user?.email === 'admin@xavef.com';

  const adminDocRef = useMemo(() => {
    if (!user?.uid || !firestore) return null;
    return doc(firestore, 'admins', user.uid);
  }, [user?.uid, firestore]);

  const { data: adminData, loading: docLoading } = useDoc<AdminData>(adminDocRef);
  
  const isAdmin = useMemo(() => isSuperAdmin || !!adminData?.isAdmin, [isSuperAdmin, adminData]);

  const loading = authLoading || (user && !isSuperAdmin ? docLoading : false);

  return { isAdmin, isSuperAdmin, loading };
}
