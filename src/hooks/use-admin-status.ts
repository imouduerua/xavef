
'use client';
import { useState, useEffect } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { collection, doc, getDoc, getDocs, query, orderBy, limit } from 'firebase/firestore';

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

      // First, check if the user is in the `admins` collection, which is the standard way.
      const adminDocRef = doc(firestore, 'admins', user.uid);
      try {
        const adminDoc = await getDoc(adminDocRef);
        if (adminDoc.exists() && adminDoc.data()?.isAdmin === true) {
          setIsAdmin(true);
          setLoading(false);
          return;
        }

        // TEMPORARY BOOTSTRAP LOGIC: If no admins exist, treat the first-ever user as the admin.
        // This is a temporary measure to grant initial access.
        const adminsQuery = query(collection(firestore, 'admins'), limit(1));
        const adminsSnapshot = await getDocs(adminsQuery);
        
        if (adminsSnapshot.empty) {
          const usersQuery = query(collection(firestore, 'users'), orderBy('createdAt', 'asc'), limit(1));
          const usersSnapshot = await getDocs(usersQuery);
          if (!usersSnapshot.empty && usersSnapshot.docs[0].id === user.uid) {
            console.warn("Temporary admin access granted to first user.");
            setIsAdmin(true);
            setLoading(false);
            return;
          }
        }
        
      } catch (error) {
        console.error("Error checking admin status:", error);
        setIsAdmin(false);
      } finally {
        if (!isAdmin) {
          setIsAdmin(false);
        }
        setLoading(false);
      }
    };

    checkAdminStatus();
  }, [user, authLoading, firestore, isAdmin]);

  return { isAdmin, loading };
}
