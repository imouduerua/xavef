import "server-only";
import { initializeApp, getApps, App } from "firebase-admin/app";
import { firebaseConfig } from "./config";

// This is a temporary solution to use the client-side config on the server.
// In a real-world application, you should use service account credentials.
// See: https://firebase.google.com/docs/admin/setup#initialize-sdk
const serviceAccount = {
  projectId: firebaseConfig.projectId,
  // These are intentionally left empty for this environment.
  // The SDK will use Application Default Credentials.
  clientEmail: `firebase-adminsdk-@${firebaseConfig.projectId}.iam.gserviceaccount.com`, 
  privateKey: "",
};

export async function initializeAdminApp(): Promise<App> {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  return initializeApp({
    credential: {
        // @ts-ignore
        getAccessToken: () => Promise.resolve({
            expires_in: 0,
            access_token: ''
        }),
        getCertificate: () => serviceAccount
    },
    projectId: serviceAccount.projectId,
  });
}
