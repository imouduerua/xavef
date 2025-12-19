
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
  if (serviceAccount) {
    app = initializeApp({
      credential: cert(JSON.parse(serviceAccount)),
    });
  } else {
    // In App Hosting, the SDK discovers credentials automatically.
    app = initializeApp();
  }
} else {
  app = getApps()[0];
}

const firestoreAdmin = getFirestore(app);
const authAdmin = getAuth(app);

export { app, firestoreAdmin, authAdmin };
