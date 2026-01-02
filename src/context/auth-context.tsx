
'use client';

import { onAuthStateChanged, type User } from 'firebase/auth';
import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { useAuth as useFirebaseAuth, useFirestore, useDoc } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { UserData } from '@/lib/types';

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  uid: string | null;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  userData: null,
  uid: null,
  loading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const auth = useFirebaseAuth();
  const firestore = useFirestore();
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    // This effect should only run once on mount to set up the listener.
    // The onAuthStateChanged listener will handle all subsequent auth state changes.
    if (!auth) {
      // Auth service isn't ready on first render, but the effect will have it on the next.
      // We don't need to re-run the effect for this.
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      // Use the functional form of setUser to avoid stale state in the closure.
      // This is the correct way to update state based on the previous state inside an effect.
      setUser(currentUser => {
        if (firebaseUser?.uid !== currentUser?.uid) {
          return firebaseUser;
        }
        return currentUser;
      });
      setAuthLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []); // <-- CORRECT: Empty dependency array ensures this runs only once.

  const uid = user?.uid ?? null;

  const userDocRef = useMemo(() => {
    if (!uid || !firestore) return null;
    return doc(firestore, 'users', uid);
  }, [uid, firestore]);

  const { data: userData, loading: docLoading } = useDoc<UserData>(userDocRef);

  const loading = authLoading || (!!uid && docLoading);

  const value = useMemo(() => ({
    user,
    userData,
    uid,
    loading,
  }), [user, userData, uid, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}
