
'use client';

import { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

/**
 * A client-side component that listens for Firestore permission errors
 * and throws them to be caught by Next.js's development error overlay.
 * This is for DEVELOPMENT ONLY to aid in debugging security rules.
 */
export function FirebaseErrorListener() {
  useEffect(() => {
    const handleError = (error: FirestorePermissionError) => {
      // Throw the error so Next.js dev overlay can pick it up.
      // In a production environment, you might log this to a service
      // instead of throwing it.
      throw error;
    };

    errorEmitter.on('permission-error', handleError);

    return () => {
      errorEmitter.off('permission-error', handleError);
    };
  }, []);

  // This component does not render anything.
  return null;
}
