
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
          // Ensure id is part of the object
          resultData = { id: snapshot.id, ...docData } as T;
        }

        const resultDataString = JSON.stringify(resultData);
        if (dataRef.current !== resultDataString) {
          dataRef.current = resultDataString;
          setData(resultData);
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
  }, [docPath, ref]);

  return { data, loading };
}
