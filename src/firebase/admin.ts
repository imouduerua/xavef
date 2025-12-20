
import 'server-only';
import { initializeApp, getApps, App, type AppOptions } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

const app = getApps().length
  ? getApps()[0]
  : initializeApp();

const firestoreAdmin = getFirestore(app);
const authAdmin = getAuth(app);

export { app, firestoreAdmin, authAdmin };
