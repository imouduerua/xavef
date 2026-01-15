
'use client';
import { useState, useEffect } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';

export function useAdminStatus() {
  const { user, loading: authLoading } = useUser();
  const firestore = useFirestore();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (authLoading) return;
      if (!user || !firestore) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }
      
      // SUPER ADMIN CHECK: Compare UID against environment variable
      const superAdminUid = process.env.NEXT_PUBLIC_FIREBASE_SUPER_ADMIN_UID;
      if (user.uid === superAdminUid) {
          setIsAdmin(true);
          setLoading(false);
          return;
      }

      // REGULAR ADMIN CHECK: Look for user in `admins` collection
      const adminDocRef = doc(firestore, 'admins', user.uid);
      try {
        const adminDoc = await getDoc(adminDocRef);
        setIsAdmin(adminDoc.exists() && adminDoc.data()?.isAdmin === true);
      } catch (error) {
        console.error("Error checking admin status:", error);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    checkAdminStatus();
  }, [user, authLoading, firestore]);

  return { isAdmin, loading };
}
