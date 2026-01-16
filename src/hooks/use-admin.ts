
'use client';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

export function useAdmin() {
  const { user, loading: authLoading } = useUser();
  const firestore = useFirestore();

  const adminDocRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'admins', user.uid);
  }, [user, firestore]);

  const { data: adminData, loading: adminDocLoading } = useDoc(adminDocRef);

  const loading = authLoading || adminDocLoading;
  
  // We consider the user an admin if the document exists and has isAdmin: true
  const isAdmin = adminData ? adminData.isAdmin === true : false;

  return { isAdmin, loading };
}
