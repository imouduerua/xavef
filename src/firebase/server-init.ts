
import { initializeApp, getApps, getApp, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import 'server-only';

// This is a server-only file. It uses the GOOGLE_APPLICATION_CREDENTIALS env var.

let app: App;
let firestore: Firestore;

if (getApps().length === 0) {
  app = initializeApp();
} else {
  app = getApp();
}

firestore = getFirestore(app);

export { app, firestore };
