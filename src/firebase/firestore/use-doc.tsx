
'use client';

import {
  onSnapshot,
  DocumentReference,
  DocumentSnapshot,
  DocumentData,
} from 'firebase/firestore';
import { useEffect, useState, useMemo, useRef } from 'react';

export function useDoc<T = DocumentData>(ref: DocumentReference<T> | null) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);

  // The path is a stable string, so we can use it as a dependency.
  const docPath = useMemo(() => ref?.path, [ref]);
  const dataRef = useRef<string | null>(null);

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
        let resultData: T | null = null;
        if (snapshot.exists()) {
          const docData = snapshot.data();
          resultData = { ...docData, id: snapshot.id } as T;
        }

        const resultDataString = JSON.stringify(resultData);
        if (dataRef.current !== resultDataString) {
          setData(resultData);
          dataRef.current = resultDataString;
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
