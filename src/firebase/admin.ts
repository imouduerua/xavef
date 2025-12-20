
import 'server-only';
import { initializeApp, getApps, App, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { firebaseConfig } from '@/firebase/config';

// This singleton pattern prevents re-initializing the SDK on every hot-reload.
const getFirebaseAdminApp = (): App => {
  // If the app is already initialized, return it.
  if (getApps().length > 0) {
    return getApps()[0];
  }

  // Otherwise, initialize a new app.
  // When running in a Google Cloud environment like Firebase App Hosting,
  // the SDK can automatically discover service account credentials.
  // However, explicitly providing the projectId from the client config
  // ensures both client and server are using the same Firebase project.
  return initializeApp({
    projectId: firebaseConfig.projectId,
  });
};

const app = getFirebaseAdminApp();
const firestoreAdmin = getFirestore(app);
const authAdmin = getAuth(app);

export { app, firestoreAdmin, authAdmin };
