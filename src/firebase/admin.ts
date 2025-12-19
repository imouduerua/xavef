'use server';
import 'server-only';
import { initializeApp, getApps, App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

let app: App;

if (!getApps().length) {
  // This will use the Application Default Credentials
  // available in the App Hosting environment.
  app = initializeApp();
} else {
  app = getApps()[0];
}

const firestore = getFirestore(app);

export { app, firestore };
