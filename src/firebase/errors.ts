
import { getAuth } from 'firebase/auth';
import { initializeFirebase } from '.';

export type SecurityRuleContext = {
  path: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  requestResourceData?: any;
};

export class FirestorePermissionError extends Error {
  public readonly context: SecurityRuleContext;
  public readonly simulationLink: string | null;

  constructor(context: SecurityRuleContext) {
    const auth = getAuth(initializeFirebase().app);
    const currentUser = auth.currentUser;

    const message = `FirestoreError: Missing or insufficient permissions: The following request was denied by Firestore Security Rules:
${JSON.stringify(
  {
    auth: currentUser
      ? {
          uid: currentUser.uid,
          token: {
            name: currentUser.displayName,
            email: currentUser.email,
            email_verified: currentUser.emailVerified,
            phone_number: currentUser.phoneNumber,
          },
        }
      : null,
    method: context.operation,
    path: `/databases/(default)/documents/${context.path}`,
    resource: context.requestResourceData,
  },
  null,
  2
)}`;

    super(message);
    this.name = 'FirestorePermissionError';
    this.context = context;
    this.simulationLink = this.generateSimulationLink(currentUser);

    // This is necessary for the error to be properly serialized and displayed
    // by Next.js's development error overlay.
    Object.setPrototypeOf(this, FirestorePermissionError.prototype);
  }

  private generateSimulationLink(user: import('firebase/auth').User | null): string | null {
    try {
        const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
        if (!projectId) return null;

        const path = encodeURIComponent(`/databases/(default)/documents/${this.context.path}`);
        const method = this.context.operation;
        const uid = user?.uid ? `uid=${encodeURIComponent(user.uid)}` : '';
        const email = user?.email ? `email=${encodeURIComponent(user.email)}` : '';
        
        const authParams = [uid, email].filter(Boolean).join(',');

        return `https://console.firebase.google.com/project/${projectId}/firestore/rules?auth_mode=custom&auth=${authParams}&method=${method}&path=${path}`;
    } catch {
        return null;
    }
  }
}
