
import { initializeApp, getApps, getApp, cert, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import 'server-only';

// This is a server-only file. It is not exposed to the client.
// dotenv config is now handled in next.config.js to ensure it's loaded on startup.

// IMPORTANT: The service account credentials must be set as an environment variable.
// In Firebase App Hosting, this is done automatically.
// For local development, you need to create a .env file with:
// GOOGLE_APPLICATION_CREDENTIALS = "path/to/your/service-account-file.json"

let app: App;
let firestore: Firestore;

try {
  // The Admin SDK will automatically find and use the GOOGLE_APPLICATION_CREDENTIALS
  // environment variable if it's set. No manual parsing is needed.
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    app = getApps().length
      ? getApp()
      : initializeApp();

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
