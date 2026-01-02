
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
    // This effect runs once on mount to set up the auth state listener.
    if (!auth) {
      // Firebase auth service might not be available on the very first render.
      // The hook will re-run once `auth` is available.
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      // Use the functional form of setUser to safely update state
      // based on the previous state, avoiding stale closure issues.
      setUser(currentUser => {
        if (firebaseUser?.uid !== currentUser?.uid) {
          return firebaseUser;
        }
        return currentUser;
      });
    });
    
    // Once the listener is attached, we can consider auth state initialized.
    setAuthLoading(false);

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [auth]); // Dependency on `auth` ensures this runs once `auth` is initialized.

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
