import { initializeApp, getApps, getApp, App as AdminApp } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import 'server-only';

let app: AdminApp;
const ADMIN_APP_NAME = 'firebase-admin-app-server-side'; // A unique name for the admin app

try {
  // Try to get an existing app with this name
  app = getApp(ADMIN_APP_NAME);
} catch (e) {
  // If it doesn't exist, initialize it.
  // Pass no arguments to initializeApp() to rely on Application Default Credentials.
  app = initializeApp({}, ADMIN_APP_NAME);
}

const firestore: Firestore = getFirestore(app);

export { app, firestore };
