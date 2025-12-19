'use server';
import 'server-only';
import { initializeApp, getApps, App, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

let app: App;

// The service account is available in the App Hosting environment.
// For local development, you can set the GOOGLE_APPLICATION_CREDENTIALS
// environment variable to the path of your service account key file.
const serviceAccount = process.env.GOOGLE_APPLICATION_CREDENTIALS;

if (!getApps().length) {
  app = initializeApp({
    credential: serviceAccount ? cert(JSON.parse(serviceAccount)) : undefined,
  });
} else {
  app = getApps()[0];
}

const firestoreAdmin = getFirestore(app);
const authAdmin = getAuth(app);

export { app, firestoreAdmin, authAdmin };
