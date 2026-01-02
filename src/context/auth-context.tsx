
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
    if (!auth) {
      // Auth service isn't ready yet, wait for it.
      setAuthLoading(true);
      return;
    }

    // Set up the listener once and let it handle all auth state changes.
    // The dependency array is [auth], so this effect only runs when `auth` is initialized.
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      // This listener will fire whenever the auth state changes (login, logout, token refresh).
      // We only update our state if the user's UID is actually different
      // to prevent re-renders on events like token refreshes.
      if (firebaseUser?.uid !== user?.uid) {
        setUser(firebaseUser);
      }
      setAuthLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [auth]); // <- CORRECTED DEPENDENCY ARRAY

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
