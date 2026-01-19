import { initializeApp, getApps, getApp, App as AdminApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import 'server-only';

let app: AdminApp;

// When deployed to App Hosting, or in a correctly configured dev environment,
// initializeApp() automatically discovers the project and credentials.
if (getApps().length === 0) {
  app = initializeApp({
    credential: applicationDefault(),
  });
} else {
  app = getApp();
}

const firestore: Firestore = getFirestore(app);

export { app, firestore };
