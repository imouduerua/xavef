
import { initializeApp, getApps, getApp, cert, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import 'server-only';

// This is a server-only file. It is not exposed to the client.

// IMPORTANT: The service account credentials must be set as an environment variable.
// In Firebase App Hosting, this is done automatically.
// For local development, you need to create a .env.local file with:
// GOOGLE_APPLICATION_CREDENTIALS = "path/to/your/service-account-file.json"

let app: App;
let firestore: Firestore;

const serviceAccount = process.env.GOOGLE_APPLICATION_CREDENTIALS 
  ? JSON.parse(Buffer.from(process.env.GOOGLE_APPLICATION_CREDENTIALS, 'base64').toString('ascii'))
  : undefined;

if (serviceAccount) {
    app = getApps().length
      ? getApp()
      : initializeApp({
          credential: cert(serviceAccount)
      });

    firestore = getFirestore(app);
} else {
    if (process.env.NODE_ENV === 'development') {
        console.warn(`
        ****************************************************************
        WARNING: Could not find GOOGLE_APPLICATION_CREDENTIALS.
        Server-side Firebase Admin SDK calls will not be authenticated.
        To fix, set the GOOGLE_APPLICATION_CREDENTIALS environment variable
        in a .env.local file to point to your service account JSON file.
        ****************************************************************
        `);
    }
    // In environments without credentials, we provide a dummy object
    // to avoid crashing the app. Server actions requiring auth will fail
    // gracefully and log errors.
    app = {} as App;
    firestore = {} as Firestore;
}

export { app, firestore };
