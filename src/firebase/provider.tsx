
'use client';

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, type Auth, type User } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { firebaseConfig } from './config';

// --- Initialize Firebase App ---
// This ensures Firebase is initialized only once.
function initializeFirebase() {
  if (getApps().length === 0) {
    return initializeApp(firebaseConfig);
  } else {
    return getApp();
  }
}
const app = initializeFirebase();

// --- Define Context Types ---
interface AuthContextType {
  user: User | null;
  loading: boolean;
}

// --- Create Context ---
const AuthContext = createContext<AuthContextType | undefined>(undefined);
const FirebaseAppContext = createContext<FirebaseApp | undefined>(undefined);

// --- Auth Provider Component ---
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth(app);
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const value = useMemo(() => ({
    user,
    loading,
  }), [user, loading]);

  return (
    <AuthContext.Provider value={value}>
      <FirebaseAppContext.Provider value={app}>
        {children}
      </FirebaseAppContext.Provider>
    </AuthContext.Provider>
  );
}

// --- Custom Hooks for easy access ---

function useAuthContext() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuthContext must be used within an AuthProvider');
    }
    return context;
}

export function useUser() {
    const { user, loading } = useAuthContext();
    return { user, uid: user?.uid ?? null, loading };
}

function useFirebaseApp() {
    const context = useContext(FirebaseAppContext);
    if (context === undefined) {
        throw new Error('useFirebaseApp must be used within an AuthProvider');
    }
    return context;
}

// These hooks provide stable instances of Auth and Firestore
export function useAuth(): Auth {
  const app = useFirebaseApp();
  return useMemo(() => getAuth(app), [app]);
}

export function useFirestore(): Firestore {
  const app = useFirebaseApp();
  return useMemo(() => getFirestore(app), [app]);
}

// Main provider to wrap the application
export function FirebaseProvider({ children }: { children: React.ReactNode }) {
  return (
      <AuthProvider>
          {children}
      </AuthProvider>
  )
}

    