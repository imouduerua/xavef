
import { initializeApp, getApps, getApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import 'server-only';

// This is a server-only file. It is not exposed to the client.

// IMPORTANT: The service account credentials must be set as an environment variable.
// In Firebase App Hosting, this is done automatically.
// For local development, you need to create a .env.local file with:
// GOOGLE_APPLICATION_CREDENTIALS = "path/to/your/service-account-file.json"

const serviceAccount = process.env.GOOGLE_APPLICATION_CREDENTIALS 
  ? JSON.parse(Buffer.from(process.env.GOOGLE_APPLICATION_CREDENTIALS, 'base64').toString('ascii'))
  : undefined;

if (!serviceAccount && process.env.NODE_ENV === 'development') {
    // In local dev, you might not have the env var set up.
    // This is a fallback to prevent crashing, but server actions needing auth will fail.
    console.warn(`
    ****************************************************************
    WARNING: Could not find GOOGLE_APPLICATION_CREDENTIALS.
    Server-side Firebase Admin SDK calls will not be authenticated.
    To fix, set the GOOGLE_APPLICATION_CREDENTIALS environment variable
    in a .env.local file to point to your service account JSON file.
    ****************************************************************
    `);
}


const app = getApps().length
  ? getApp()
  : initializeApp({
      credential: serviceAccount ? cert(serviceAccount) : undefined
  });

export const firestore = getFirestore(app);
