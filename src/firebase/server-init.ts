import { initializeApp, getApps, getApp, App as AdminApp } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import 'server-only';

let app: AdminApp;

// When deployed to App Hosting, initializeApp() automatically discovers the project
// and credentials. No configuration is required.
if (getApps().length === 0) {
  app = initializeApp();
} else {
  app = getApp();
}

const firestore: Firestore = getFirestore(app);

export { app, firestore };
