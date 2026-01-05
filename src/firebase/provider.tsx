
'use client';

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, type Auth, type User } from 'firebase/auth';
import { getFirestore, type Firestore, initializeFirestore, memoryLocalCache } from 'firebase/firestore';
import { firebaseConfig } from './config';

// --- Initialize Firebase App ---
// This ensures Firebase is initialized only once, globally.
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
// Initialize Firestore with memory cache to avoid persistence-related issues in some environments.
const firestore = initializeFirestore(app, {
    localCache: memoryLocalCache()
});


// --- Define Context Types ---
interface FirebaseContextType {
  app: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
  user: User | null;
  loading: boolean;
}

// --- Create Context ---
const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);


// --- Main Provider Component ---
export function FirebaseProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const value = useMemo(() => ({
    app,
    auth,
    firestore,
    user,
    loading,
  }), [user, loading]);

  return (
    <FirebaseContext.Provider value={value}>
      {children}
    </FirebaseContext.Provider>
  );
}

// --- Custom Hooks for easy access ---

function useFirebaseContext() {
    const context = useContext(FirebaseContext);
    if (context === undefined) {
        throw new Error('useFirebaseContext must be used within a FirebaseProvider');
    }
    return context;
}

export function useUser() {
    const { user, loading } = useFirebaseContext();
    return { user, uid: user?.uid ?? null, loading };
}

export function useAuth(): Auth {
  const { auth } = useFirebaseContext();
  if (!auth) {
    throw new Error("Firebase Auth has not been initialized.");
  }
  return auth;
}

export function useFirestore(): Firestore {
  const { firestore } = useFirebaseContext();
  if (!firestore) {
    throw new Error("Firestore has not been initialized.");
  }
  return firestore;
}
