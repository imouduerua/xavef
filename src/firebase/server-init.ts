
import { initializeApp, getApps, getApp, cert, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import 'server-only';
import { config } from 'dotenv';

// This is a server-only file. It is not exposed to the client.
config();


// IMPORTANT: The service account credentials must be set as an environment variable.
// In Firebase App Hosting, this is done automatically.
// For local development, you need to create a .env file with:
// GOOGLE_APPLICATION_CREDENTIALS = "path/to/your/service-account-file.json"

let app: App;
let firestore: Firestore;

try {
  const serviceAccountString = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  
  if (serviceAccountString) {
    const serviceAccount = JSON.parse(Buffer.from(serviceAccountString, 'base64').toString('utf8'));

    app = getApps().length
      ? getApp()
      : initializeApp({
          credential: cert(serviceAccount)
      });

    firestore = getFirestore(app);
  } else {
    // If no service account, create dummy objects to avoid crashes on import.
    // The functions using these will have guards to prevent execution.
    app = {} as App;
    firestore = {} as Firestore;
     if (process.env.NODE_ENV === 'development') {
        console.warn(`
        ****************************************************************
        WARNING: Could not find GOOGLE_APPLICATION_CREDENTIALS.
        Server-side Firebase Admin SDK calls will not be authenticated.
        To fix, set the GOOGLE_APPLICATION_CREDENTIALS environment variable
        in a .env file to point to your service account JSON file.
        ****************************************************************
        `);
    }
  }
} catch (e: any) {
  console.error("Failed to initialize Firebase Admin SDK:", e.message);
  app = {} as App;
  firestore = {} as Firestore;
}


export { app, firestore };
