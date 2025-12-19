
'use client';

import { useUser, useDoc, useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';
import React from 'react';

type AdminData = {
  isAdmin: boolean;
};

export function useAdminStatus() {
  const { user, loading: userLoading } = useUser();
  const firestore = useFirestore();

  // Super admin check
  const isSuperAdmin = user?.email === 'admin@xavef.com';

  const adminDocRef = React.useMemo(() => {
    // If the user is the super admin, we don't need to check Firestore.
    if (!user || isSuperAdmin) return null;
    return doc(firestore, 'admins', user.uid);
  }, [user, firestore, isSuperAdmin]);

  const { data: adminData, loading: docLoading } = useDoc<AdminData>(adminDocRef);

  // An admin is either the super admin or is marked as an admin in the database.
  const isAdmin = isSuperAdmin || adminData?.isAdmin === true;

  // Loading is complete when user loading is done, AND if we need to check the doc, doc loading is also done.
  const loading = userLoading || (user && !isSuperAdmin ? docLoading : false);


  return { isAdmin, loading };
}
