
'use client';

import { onAuthStateChanged, type User } from 'firebase/auth';
import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { useAuth as useFirebaseAuth, useFirestore, useDoc } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { UserData } from '@/lib/types';

interface AuthContextType {
  user: User | null;
  uid: string | null;
  loading: boolean;
  userData: UserData | null;
  userDataLoading: boolean;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  uid: null,
  loading: true,
  userData: null,
  userDataLoading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const auth = useFirebaseAuth();
  const firestore = useFirestore();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) return;

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth]);

  const uid = user?.uid ?? null;

  const userDocRef = useMemo(() => {
    if (!uid || !firestore) return null;
    return doc(firestore, 'users', uid);
  }, [uid, firestore]);

  const { data: userData, loading: userDataLoading } = useDoc<UserData>(userDocRef);

  const value = useMemo(() => ({
    user,
    uid,
    loading,
    userData,
    userDataLoading,
  }), [user, uid, loading, userData, userDataLoading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}
