'use client';

import { initializeFirebase } from '@/firebase';
import { FirebaseProvider } from '@/firebase/provider';
import type { FirebaseApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';
import { ReactNode, useEffect, useState } from 'react';

// Define a type for the Firebase services
type FirebaseServices = {
  app: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
};

export function FirebaseClientProvider({ children }: { children: ReactNode }) {
  // Use state to hold the Firebase services object.
  // Initialize with null.
  const [firebaseServices, setFirebaseServices] = useState<FirebaseServices | null>(null);

  useEffect(() => {
    // This effect runs only once on the client after the component mounts.
    // It initializes Firebase and sets the services in state.
    // This prevents re-initialization on every render.
    if (!firebaseServices) {
      setFirebaseServices(initializeFirebase());
    }
  }, []); // The empty dependency array is crucial.

  // If Firebase services are not yet initialized, you can render null, a loading spinner, or a skeleton screen.
  // This prevents children from trying to access a null context.
  if (!firebaseServices) {
    return null; 
  }

  // Once initialized, provide the stable services to the context.
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
