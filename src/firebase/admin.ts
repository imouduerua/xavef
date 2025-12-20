
import 'server-only';
import { initializeApp, getApps, App, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { firebaseConfig } from './config';

// This singleton pattern prevents re-initializing the SDK on hot reloads.
const getFirebaseAdminApp = (): App => {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  // When running in a Google Cloud environment like App Hosting,
  // the SDK automatically uses the default service account credentials.
  // Explicitly passing the projectId ensures it connects to the correct project.
  return initializeApp({
    projectId: firebaseConfig.projectId,
  });
};

const app = getFirebaseAdminApp();
const firestoreAdmin = getFirestore(app);
const authAdmin = getAuth(app);

export { app, firestoreAdmin, authAdmin };
