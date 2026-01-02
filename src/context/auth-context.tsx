
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
      setAuthLoading(true);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
       // Only update state if the user's UID has actually changed.
       // This prevents re-renders on token refresh and breaks the infinite loop.
      if (firebaseUser?.uid !== user?.uid) {
        setUser(firebaseUser);
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, [auth, user?.uid]);

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
