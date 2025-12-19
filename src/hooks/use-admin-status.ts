
'use client';

import { useUser, useDoc, useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';
import React from 'react';

type AdminData = {
  isAdmin: boolean;
};

export function useAdminStatus() {
  const { user } = useUser();
  const firestore = useFirestore();

  const adminDocRef = React.useMemo(() => {
    if (!user) return null;
    return doc(firestore, 'admins', user.uid);
  }, [user, firestore]);

  const { data: adminData, loading } = useDoc<AdminData>(adminDocRef);

  const isAdmin = adminData?.isAdmin === true;

  // Combine user loading and admin data loading
  const combinedLoading = useUser().loading || loading;

  return { isAdmin, loading: combinedLoading };
}
