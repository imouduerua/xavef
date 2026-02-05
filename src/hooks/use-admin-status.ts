'use client';
import { useUser, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

/**
 * This hook is used in the main application layout to determine if a logged-in
 * user has admin privileges. This is used to control access and UI elements
 * for users who might also be admins.
 */
export function useAdminStatus() {
  const { user, loading: authLoading } = useUser();
  const firestore = useFirestore();

  const adminDocRef = useMemoFirebase(() => (firestore && user?.uid) ? doc(firestore, 'admins', user.uid) : null, [firestore, user?.uid]);

  const { data: adminDoc, loading: adminDocLoading } = useDoc(adminDocRef);

  const isSuperAdmin = user?.email === 'admin@xavef.com';
  const isAdminFromFirestore = !!adminDoc;

  const isAdmin = isSuperAdmin || isAdminFromFirestore;
  const loading = authLoading || adminDocLoading;

  return { isAdmin, loading };
}
