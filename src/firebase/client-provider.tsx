'use client';

import { initializeFirebase } from '@/firebase';
import { FirebaseProvider } from '@/firebase/provider';
import type { FirebaseApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';
import { ReactNode } from 'react';

// Initialize Firebase services immediately and only once.
const firebaseServices = initializeFirebase();

export function FirebaseClientProvider({ children }: { children: ReactNode }) {
  // The services are stable and created only once, so we can pass them directly.
  // This avoids using useState and causing a re-render on initialization,
  // which was the source of the infinite loop.
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
