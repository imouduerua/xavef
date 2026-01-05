
import { initializeApp, getApps, getApp, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import 'server-only';

// This is a server-only file.
// The Firebase Admin SDK will automatically find and use the credentials specified
// by the GOOGLE_APPLICATION_CREDENTIALS environment variable. For local development,
// this variable should be set in a .env file to point to your service account JSON file.
// Example: GOOGLE_APPLICATION_CREDENTIALS="/Users/you/Downloads/my-project-firebase-adminsdk.json"

let app: App;
let firestore: Firestore;

// Per best practice, we only initialize the app once.
if (!getApps().length) {
    // This will throw an error during server startup if GOOGLE_APPLICATION_CREDENTIALS
    // is not set, which is the desired "fail-fast" behavior. This prevents the server
    // from running in a misconfigured state.
    app = initializeApp();
} else {
    app = getApp();
}

firestore = getFirestore(app);

export { app, firestore };
