
'use client';

import {
  onSnapshot,
  DocumentReference,
  DocumentSnapshot,
  DocumentData,
  FirestoreError,
} from 'firebase/firestore';
import { useEffect, useState, useMemo } from 'react';

export function useDoc<T = DocumentData>(ref: DocumentReference<T> | null) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<FirestoreError | null>(null);

  // The document's path is a stable string, making it a reliable dependency.
  const docPath = useMemo(() => ref?.path, [ref]);

  useEffect(() => {
    if (!docPath || !ref) {
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
          setData({ id: snapshot.id, path: snapshot.ref.path, ...snapshot.data() } as T & { id: string; path: string });
        } else {
          setData(null);
        }
        setLoading(false);
        setError(null);
      },
      (err: FirestoreError) => {
        console.error(`Error fetching document at ${ref.path}:`, err);
        
        setError(err);
        setData(null);
        setLoading(false);
      }
    );

    // This useEffect will re-run only if the document path changes.
    return () => unsubscribe();
  }, [docPath, ref]);

  return { data, loading, error };
}
