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

  // Memoize the ref object to prevent re-running the effect on every render
  const memoizedRef = useMemo(() => ref, [ref]);

  useEffect(() => {
    if (!memoizedRef) {
      setData(null);
      setLoading(false);
      return;
    }
    
    setLoading(true);

    const unsubscribe = onSnapshot(
      memoizedRef,
      (snapshot: DocumentSnapshot<T>) => {
        if (snapshot.exists()) {
          setData({ ...snapshot.data(), id: snapshot.id });
        } else {
          // Document does not exist
          setData(null);
        }
        // Data has been fetched (or confirmed not to exist), so loading is complete.
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching document:', error);
        setData(null);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [memoizedRef]);

  return { data, loading };
}
