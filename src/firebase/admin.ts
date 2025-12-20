
import 'server-only';
import { initializeApp, getApps, App, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

// This singleton pattern prevents re-initializing the SDK on every hot-reload.
const getFirebaseAdminApp = (): App => {
  // If the app is already initialized, return it.
  if (getApps().length > 0) {
    return getApps()[0];
  }

  // Otherwise, initialize a new app.
  // When running in a Google Cloud environment like Firebase App Hosting,
  // the SDK automatically discovers the service account credentials.
  // Calling initializeApp() with no arguments is the recommended approach.
  return initializeApp();
};

const app = getFirebaseAdminApp();
const firestoreAdmin = getFirestore(app);
const authAdmin = getAuth(app);

export { app, firestoreAdmin, authAdmin };
