
import { initializeApp, getApps, getApp, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import 'server-only';

// This is a server-only file. It is not exposed to the client.
// dotenv config is now handled in next.config.js to ensure it's loaded on startup.

// The Firebase Admin SDK will automatically find and use the credentials specified
// by the GOOGLE_APPLICATION_CREDENTIALS environment variable. For local development,
// this variable should be set in a .env file to point to your service account JSON file.
// Example: GOOGLE_APPLICATION_CREDENTIALS="/Users/you/Downloads/my-project-firebase-adminsdk.json"

let app: App;
let firestore: Firestore;

try {
  app = getApps().length
    ? getApp()
    : initializeApp();

  firestore = getFirestore(app);

} catch (e: any) {
  console.error("CRITICAL: Failed to initialize Firebase Admin SDK. Server-side Firestore operations will fail. Error: ", e.message);
  // In case of an error, we'll create dummy objects to prevent the app from crashing on import.
  // Functions that use these objects will have their own guards.
  app = {} as App;
  firestore = {} as Firestore;
}

export { app, firestore };
