
import 'server-only';
import { initializeApp, getApps, App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

let app: App;

if (!getApps().length) {
  // In a managed environment like App Hosting, the SDK discovers credentials automatically.
  app = initializeApp();
} else {
  app = getApps()[0];
}

const firestoreAdmin = getFirestore(app);
const authAdmin = getAuth(app);

export { app, firestoreAdmin, authAdmin };
