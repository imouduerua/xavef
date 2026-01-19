
import { initializeApp, getApps, getApp, App as AdminApp } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import 'server-only';

let app: AdminApp;

// When deployed to App Hosting, or in a correctly configured dev environment,
// initializeApp() automatically discovers the project and credentials.
if (getApps().length === 0) {
  // Explicitly providing the service account ID to resolve credential discovery issues.
  app = initializeApp({
    serviceAccountId: 'firebase-app-hosting-iam-admin@studio-4192523715-e9157.iam.gserviceaccount.com',
  });
} else {
  app = getApp();
}

const firestore: Firestore = getFirestore(app);

export { app, firestore };
