
'use client';

import {
  onSnapshot,
  DocumentReference,
  DocumentSnapshot,
  DocumentData,
} from 'firebase/firestore';
import { useEffect, useState, useMemo } from 'react';

export function useDoc<T = DocumentData>(ref: DocumentReference<T> | null) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);

  // The path is a stable string, so we can use it as a dependency.
  const docPath = useMemo(() => ref?.path, [ref]);

  useEffect(() => {
    if (!ref) {
      setData(null);
      setLoading(false);
      return;
    }
    
    setLoading(true);

    const unsubscribe = onSnapshot(
      ref,
      (snapshot: DocumentSnapshot<T>) => {
        if (snapshot.exists()) {
          const docData = snapshot.data();
          setData({ ...docData, id: snapshot.id } as T);
        } else {
          // Document does not exist
          setData(null);
        }
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching document:', error);
        setData(null);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [docPath]); // Depend on the stable path

  return { data, loading };
}
