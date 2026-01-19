
import { initializeApp, getApps, getApp, App as AdminApp } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import 'server-only';

let app: AdminApp;

// When deployed to App Hosting, initializeApp() automatically discovers the project
// and credentials. In a local dev environment, we might need to provide the project ID.
if (getApps().length === 0) {
  app = initializeApp({
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  });
} else {
  app = getApp();
}

const firestore: Firestore = getFirestore(app);

export { app, firestore };
