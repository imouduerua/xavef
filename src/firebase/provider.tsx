
'use client';

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { type FirebaseApp } from 'firebase/app';
import { onAuthStateChanged, type Auth, type User } from 'firebase/auth';
import { type Firestore } from 'firebase/firestore';

// --- Define Context Types ---
interface FirebaseContextType {
  app: FirebaseApp | null;
  auth: Auth | null;
  firestore: Firestore | null;
  user: User | null;
  loading: boolean;
}

// --- Create Context ---
const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

// --- Main Provider Component ---
export function FirebaseProvider({ 
  app, 
  auth, 
  firestore, 
  children 
}: { 
  app: FirebaseApp | null;
  auth: Auth | null;
  firestore: Firestore | null;
  children: React.ReactNode; 
}) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }
    
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [auth]);

  const value = useMemo(() => ({
    app,
    auth,
    firestore,
    user,
    loading,
  }), [app, auth, firestore, user, loading]);

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

export function useAuth(): Auth | null {
  const { auth } = useFirebaseContext();
  if (!auth) {
    // This warning can be noisy, but it's useful for debugging.
    // console.warn("Firebase Auth has not been initialized.");
    return null;
  }
  return auth;
}

export function useFirestore(): Firestore | null {
  const { firestore } = useFirebaseContext();
  if (!firestore) {
    // console.warn("Firebase Firestore has not been initialized or is not available.");
    return null;
  }
  return firestore;
}

export function useFirebaseApp(): FirebaseApp | null {
  const { app } = useFirebaseContext();
  if (!app) {
    // console.warn("Firebase App has not been initialized.");
    return null;
  }
  return app;
}
