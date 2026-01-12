
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

export function useAuth(): Auth {
  const { auth } = useFirebaseContext();
  if (!auth) {
    throw new Error("Firebase Auth has not been initialized.");
  }
  return auth;
}

export function useFirestore(): Firestore {
  const { firestore, loading } = useFirebaseContext();
  if (loading && !firestore) {
    // This state can happen during initial load. It's better to throw
    // or handle it gracefully than to return null and cause downstream errors.
    // Throwing an error here makes it clear that something is trying to use Firestore too early.
    throw new Error("useFirestore was called before Firestore has been initialized. Ensure components using this hook are rendered only after Firebase is ready.");
  }
  if (!firestore) {
    throw new Error("Firebase Firestore has not been initialized or is not available.");
  }
  return firestore;
}

export function useFirebaseApp(): FirebaseApp {
  const { app } = useFirebaseContext();
  if (!app) {
    throw new Error("Firebase App has not been initialized.");
  }
  return app;
}
