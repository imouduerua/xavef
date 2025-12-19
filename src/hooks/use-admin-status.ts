
'use client';

import { useUser, useDoc, useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';
import React from 'react';

type AdminData = {
  isAdmin: boolean;
};

const SUPER_ADMIN_EMAIL = "admin@xavef.com";

export function useAdminStatus() {
  const { user } = useUser();
  const firestore = useFirestore();

  // Special check for the super admin email
  if (user && user.email === SUPER_ADMIN_EMAIL) {
    return { isAdmin: true, loading: false };
  }

  const adminDocRef = React.useMemo(() => {
    if (!user) return null;
    return doc(firestore, 'admins', user.uid);
  }, [user, firestore]);

  const { data: adminData, loading } = useDoc<AdminData>(adminDocRef);

  return { isAdmin: adminData?.isAdmin === true, loading };
}
