
'use client';

import type { FirebaseApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';
import { User } from 'firebase/auth';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

const FirebaseContext = createContext<{
  app: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
} | null>(null);

export function useFirebase() {
  const context = useContext(FirebaseContext);

  if (!context) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }

  return context;
}

export function useFirebaseApp() {
  return useFirebase().app;
}

export function useAuth() {
  return useFirebase().auth;
}

export function useFirestore() {
  return useFirebase().firestore;
}

export const FirebaseProvider = (props: {
  children: React.ReactNode;
  app: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
}) => {
  const { app, auth, firestore, children } = props;
  const value = useMemo(
    () => ({
      app,
      auth,
      firestore,
    }),
    [app, auth, firestore]
  );

  return (
    <FirebaseContext.Provider value={value}>
      {children}
    </FirebaseContext.Provider>
  );
};
