
'use client';
import { useState, useEffect } from 'react';
import { useUser, useFirestore, useCollection } from '@/firebase';
import { collection, getDoc, orderBy, query, limit, getDocs } from 'firebase/firestore';
import { useMemoFirebase } from '@/firebase/use-memo-firebase';

export function useAdminStatus() {
  const { user, loading: authLoading } = useUser();
  const firestore = useFirestore();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      setLoading(true);
      
      if (authLoading) {
        return; // Wait for auth to resolve
      }

      if (!user || !firestore) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      try {
        // 1. Check if the user has a specific document in the 'admins' collection.
        const adminDocRef = doc(firestore, 'admins', user.uid);
        const adminDoc = await getDoc(adminDocRef);
        if (adminDoc.exists() && adminDoc.data()?.isAdmin === true) {
          setIsAdmin(true);
          setLoading(false);
          return;
        }

        // 2. If not, check if the 'admins' collection is empty.
        const adminsCollectionRef = collection(firestore, 'admins');
        const adminsSnapshot = await getDocs(query(adminsCollectionRef, limit(1)));
        
        // 3. If the admins collection is empty, check if the current user is the first user ever created.
        if (adminsSnapshot.empty) {
          const firstUserQuery = query(collection(firestore, 'users'), orderBy('createdAt', 'asc'), limit(1));
          const firstUserSnapshot = await getDocs(firstUserQuery);
          if (!firstUserSnapshot.empty && firstUserSnapshot.docs[0].id === user.uid) {
             setIsAdmin(true);
          } else {
             setIsAdmin(false);
          }
        } else {
           // If admins collection is not empty and user is not in it, they are not an admin.
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
