'use client';

import {
  onSnapshot,
  Query,
  QuerySnapshot,
  DocumentData,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';

export function useCollection<T = DocumentData>(query: Query<T> | null) {
  const [data, setData] = useState<T[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!query) {
      setData(null);
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(
      query,
      (snapshot: QuerySnapshot<T>) => {
        const data = snapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
        }));
        setData(data);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching collection:', error);
        setData(null);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [query]);

  return { data, loading };
}
