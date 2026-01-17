'use client';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

/**
 * This hook is used in the main application layout to determine if a logged-in
 * user has admin privileges. This is used to control access and UI elements
 * for users who might also be admins.
 */
export function useAdminStatus() {
  const { user, loading: authLoading } = useUser();
  const firestore = useFirestore();

  const adminDocRef = useMemoFirebase(
    () => (user?.uid && firestore ? doc(firestore, 'admins', user.uid) : null),
    [user?.uid, firestore]
  );

  const { data: adminDoc, loading: adminLoading } = useDoc(adminDocRef);

  // Fallback for the initial hardcoded admin.
  const isHardcodedAdmin = user?.email === 'admin@xavef.com';

  const isAdmin = !!adminDoc || isHardcodedAdmin;
  const loading = authLoading || (!isHardcodedAdmin && adminLoading);

  return { isAdmin, loading };
}
