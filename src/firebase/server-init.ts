
import { initializeApp, getApps, getApp, App as AdminApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import 'server-only';

// This is the simplest, most robust way to initialize the Firebase Admin SDK.
// It relies on the standard Application Default Credentials (ADC) provided by the cloud environment.
// It ensures that the app is only initialized once.
const app: AdminApp = getApps().length > 0 ? getApp() : initializeApp({
    credential: applicationDefault(),
});

const firestore: Firestore = getFirestore(app);

export { app, firestore };
