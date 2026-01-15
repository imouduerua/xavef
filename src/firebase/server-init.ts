import { initializeApp, getApps, getApp, type App, type AppOptions } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import 'server-only';

// Explicitly set the project ID to match the client-side config.
const adminConfig: AppOptions = {
    projectId: 'studio-4192523715-e9157',
};

let app: App;
if (getApps().length === 0) {
  app = initializeApp(adminConfig);
} else {
  app = getApp();
}

const firestore: Firestore = getFirestore(app);

export { app, firestore };
