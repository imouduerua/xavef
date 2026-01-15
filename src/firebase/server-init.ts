import { initializeApp, getApps, getApp, App as AdminApp, AppOptions, cert } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import 'server-only';

// This is the project ID from your firebaseConfig. It MUST match the client-side config.
const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'studio-4192523715-e9157';

const adminConfig: AppOptions = {
    projectId: projectId,
};

let app: AdminApp;
if (getApps().length === 0) {
  app = initializeApp(adminConfig);
} else {
  app = getApp();
}

const firestore: Firestore = getFirestore(app);

export { app, firestore };
