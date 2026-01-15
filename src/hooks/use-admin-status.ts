
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
      if (authLoading) {
          setLoading(true);
          return;
      };
      
      if (!user || !firestore) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      setLoading(true);
      const adminDocRef = doc(firestore, 'admins', user.uid);
      try {
        const adminDoc = await getDoc(adminDocRef);
        if (adminDoc.exists() && adminDoc.data()?.isAdmin === true) {
          setIsAdmin(true);
        } else {
            // Fallback for the temporary first-user admin logic handled by the server.
            // This is a client-side guess that will be corrected upon page load/navigation
            // but the server session check is the real source of truth.
            // A more robust solution involves a dedicated claim or API endpoint.
            // For now, we assume the session check on navigation will handle redirects.
            setIsAdmin(false); 
        }
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
