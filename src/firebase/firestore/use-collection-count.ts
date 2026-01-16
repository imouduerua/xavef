'use client';

import {
  Query,
  DocumentData,
  FirestoreError,
  getCountFromServer,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { useUser } from '@/firebase';

export function useCollectionCount(query: Query | null) {
  const { user, loading: authLoading } = useUser();
  const [count, setCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<FirestoreError | null>(null);

  useEffect(() => {
    if (authLoading || !user || !query) {
      setLoading(false);
      return;
    }

    const fetchCount = async () => {
      setLoading(true);
      try {
        const snapshot = await getCountFromServer(query);
        setCount(snapshot.data().count);
      } catch (err: any) {
        console.error(`[useCollectionCount] Error fetching count:`, err);
        setError(err);
        setCount(0); // Set to 0 on error
      } finally {
        setLoading(false);
      }
    };

    fetchCount();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, user, authLoading]);

  return { count, loading, error };
}
