
'use client';

import { FirebaseProvider } from '@/firebase/provider';
import { firebaseConfig } from './config';
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { ReactNode, useMemo } from 'react';

/**
 * Provides the initialized Firebase services (app, auth, firestore) to its children
 * via React context. This component ensures that the Firebase services are initialized
 * only once and are stable across re-renders, preventing infinite loops.
 */
export function FirebaseClientProvider({ children }: { children: ReactNode }) {
  // The services are initialized inside useMemo with an empty dependency array,
  // guaranteeing they are created only once per client session and have stable references.
  const firebaseServices = useMemo(() => {
    const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    const auth = getAuth(app);
    const firestore = getFirestore(app);
    return { app, auth, firestore };
  }, []);

  return (
    <FirebaseProvider
      app={firebaseServices.app}
      auth={firebaseServices.auth}
      firestore={firebaseServices.firestore}
    >
      {children}
    </FirebaseProvider>
  );
}
