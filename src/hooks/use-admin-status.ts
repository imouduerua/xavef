
'use client';
import { useState, useEffect } from 'react';
import { useUser, useFirestore, useCollection } from '@/firebase';
import { collection, getDoc, orderBy, query, limit } from 'firebase/firestore';
import { useMemoFirebase } from '@/firebase/use-memo-firebase';

export function useAdminStatus() {
  const { user, loading: authLoading } = useUser();
  const firestore = useFirestore();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // Memoize the query for the first user
  const firstUserQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'users'), orderBy('createdAt', 'asc'), limit(1));
  }, [firestore]);

  const { data: firstUser, loading: firstUserLoading } = useCollection(firstUserQuery);

  useEffect(() => {
    const checkAdminStatus = async () => {
      // Don't proceed until both auth and the first user query have settled.
      if (authLoading || firstUserLoading) {
        setLoading(true);
        return;
      }
      
      // If there's no logged-in user, they are not an admin.
      if (!user || !firestore) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        // 1. Check if the user has a specific document in the 'admins' collection.
        const adminDocRef = (await import('firebase/firestore')).doc(firestore, 'admins', user.uid);
        const adminDoc = await getDoc(adminDocRef);
        if (adminDoc.exists() && adminDoc.data()?.isAdmin === true) {
          setIsAdmin(true);
          setLoading(false);
          return;
        }

        // 2. If not, check if the 'admins' collection is empty.
        const adminsCollectionRef = (await import('firebase/firestore')).collection(firestore, 'admins');
        const adminsSnapshot = await (await import('firebase/firestore')).getDocs(query(adminsCollectionRef, limit(1)));
        
        // 3. If it's empty, apply the bootstrap logic: the first registered user is the admin.
        if (adminsSnapshot.empty && firstUser && firstUser.length > 0 && firstUser[0].id === user.uid) {
           setIsAdmin(true);
        } else {
           // Otherwise, they are not an admin.
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
  }, [user, authLoading, firestore, firstUser, firstUserLoading]);

  return { isAdmin, loading };
}
