
'use client';

import { FirebaseProvider } from '@/firebase/provider';
import { firebaseConfig } from './config';
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { ReactNode } from 'react';

// Initialize Firebase services ONCE, outside of the component.
// This ensures they are stable and not recreated on every render.
let firebaseApp: FirebaseApp;
if (!getApps().length) {
  firebaseApp = initializeApp(firebaseConfig);
} else {
  firebaseApp = getApp();
}

const auth: Auth = getAuth(firebaseApp);
const firestore: Firestore = getFirestore(firebaseApp);

/**
 * Provides the initialized Firebase services (app, auth, firestore) to its children
 * via React context. This component ensures that the Firebase services are initialized
 * only once and are stable across re-renders, preventing infinite loops.
 */
export function FirebaseClientProvider({ children }: { children: ReactNode }) {
  // The services are now stable, so we can provide them directly.
  return (
    <FirebaseProvider app={firebaseApp} auth={auth} firestore={firestore}>
      {children}
    </FirebaseProvider>
  );
}
