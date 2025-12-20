
// This is a server-only file to initialize the admin SDK
import { initializeApp, getApps, App, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
  : undefined;

const app =
  getApps().length > 0
    ? getApps()[0]
    : initializeApp({
        credential: serviceAccount ? cert(serviceAccount) : undefined,
      });

export const firestore = getFirestore(app);
