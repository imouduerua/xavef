import { initializeApp, getApps, getApp, App as AdminApp } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import 'server-only';

// This simpler pattern is more robust for some environments.
// It ensures we use the default app instance if it already exists.
const app: AdminApp = getApps().length > 0 ? getApp() : initializeApp();

const firestore: Firestore = getFirestore(app);

export { app, firestore };
