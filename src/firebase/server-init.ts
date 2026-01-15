import { initializeApp, getApps, getApp, type App, type AppOptions } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import 'server-only';

// This is the project ID from your firebaseConfig. It MUST match the client-side config.
const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'studio-4192523715-e9157';

const adminConfig: AppOptions = {
    projectId: projectId,
};

let app: App;
if (getApps().length === 0) {
  // If no app is initialized, create a new one.
  app = initializeApp(adminConfig);
} else {
  // Otherwise, use the existing app.
  app = getApp();
}

const firestore: Firestore = getFirestore(app);

export { app, firestore };
