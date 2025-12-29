
'use client';

import {
  onSnapshot,
  DocumentReference,
  DocumentSnapshot,
  DocumentData,
  FirestoreError,
} from 'firebase/firestore';
import { useEffect, useState, useMemo } from 'react';
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError } from '../errors';

export function useDoc<T = DocumentData>(ref: DocumentReference<T> | null) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<FirestoreError | null>(null);

  // Use the document's path as the dependency, which is a stable string.
  const docPath = useMemo(() => ref?.path, [ref]);

  useEffect(() => {
    if (!ref) {
      setData(null);
      setLoading(false);
      setError(null);
      return;
    }
    
    setLoading(true);

    const unsubscribe = onSnapshot(
      ref,
      (snapshot: DocumentSnapshot<T>) => {
        if (snapshot.exists()) {
          // Combine id and data into a single object
          setData({ id: snapshot.id, ...snapshot.data() } as T);
        } else {
          setData(null);
        }
        setLoading(false);
        setError(null);
      },
      (err: FirestoreError) => {
        console.error(`Error fetching document at ${ref.path}:`, err);
        
        if (err.code === 'permission-denied') {
            const permissionError = new FirestorePermissionError({
                path: ref.path,
                operation: 'get',
            });
            errorEmitter.emit('permission-error', permissionError);
        }
        
        setError(err);
        setData(null);
        setLoading(false);
      }
    );

    // This useEffect will re-run only if the document path changes.
    return () => unsubscribe();
  }, [docPath, ref]); // `ref` is included in case it changes while path is same (not typical but safe)

  return { data, loading, error };
}
