import { initializeApp, getApps, getApp, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import 'server-only';

let app: App;
if (getApps().length === 0) {
  app = initializeApp();
} else {
  app = getApp();
}

const firestore: Firestore = getFirestore(app);

export { app, firestore };
