'use client';
import { useUser, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

/**
 * This hook checks if the currently logged-in user is an administrator.
 * It checks for two conditions:
 * 1. If the user's email is the hardcoded super admin email ('admin@xavef.com').
 * 2. If a document with the user's UID exists in the 'admins' collection in Firestore.
 */
export function useAdmin() {
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
