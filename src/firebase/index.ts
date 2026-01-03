// src/firebase/index.ts

import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { firebaseConfig } from './config';

// Stable, memoized instances
let firebaseApp: FirebaseApp;
let auth: Auth;
let firestore: Firestore;

/**
 * Idempotent function to initialize and get Firebase services.
 * This can be called multiple times but will only initialize the app once.
 */
function getFirebase() {
  if (!firebaseApp) {
    if (getApps().length === 0) {
      firebaseApp = initializeApp(firebaseConfig);
    } else {
      firebaseApp = getApp();
    }
    auth = getAuth(firebaseApp);
    firestore = getFirestore(firebaseApp);
  }
  return { app: firebaseApp, auth, firestore };
}

// Export the getter function
export { getFirebase };

// Re-export hooks that will now use the stable getter internally
export { useCollection } from './firestore/use-collection';
export { useDoc } from './firestore/use-doc';
