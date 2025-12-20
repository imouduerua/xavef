
import 'server-only';
import { initializeApp, getApps, App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { firebaseConfig } from '@/firebase/config';

// This singleton pattern prevents re-initializing the SDK on every hot-reload.
const getFirebaseAdminApp = (): App => {
  // If the app is already initialized, return it.
  const existingApp = getApps().find(app => app.name === '[DEFAULT]');
  if (existingApp) {
    return existingApp;
  }

  // When running in a Google Cloud environment like Firebase App Hosting,
  // the SDK can automatically discover service account credentials.
  // We don't need to manually provide them.
  return initializeApp({
    projectId: firebaseConfig.projectId,
  });
};

const app = getFirebaseAdminApp();
const firestoreAdmin = getFirestore(app);
const authAdmin = getAuth(app);

export { app, firestoreAdmin, authAdmin };
