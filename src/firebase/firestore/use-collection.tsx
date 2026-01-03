
'use client';

import {
  onSnapshot,
  Query,
  QuerySnapshot,
  DocumentData,
  FirestoreError,
} from 'firebase/firestore';
import { useEffect, useState, useMemo } from 'react';
import { getFirebase } from '@/firebase';

const createQueryKey = (query: Query<any> | null): string | null => {
    if (!query) return null;
    try {
        const internalQuery = (query as any)._query;
        if (!internalQuery) return null;
        return JSON.stringify({
            path: internalQuery.path.segments.join('/'),
            filters: internalQuery.filters?.map((f: any) => `${f.field.segments.join('.')}${f.op}${JSON.stringify(f.value)}`),
            orderBy: internalQuery.orderBy?.map((o: any) => `${o.field.segments.join('.')}${o.dir}`),
            limit: internalQuery.limit,
            startAt: internalQuery.startAt,
            endAt: internalQuery.endAt,
        });
    } catch (e) {
        console.error("Could not serialize query:", e);
        return String(Math.random());
    }
};

export function useCollection<T = DocumentData>(query: Query<T> | null) {
  const [data, setData] = useState<T[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<FirestoreError | null>(null);
  const [indexCreationUrl, setIndexCreationUrl] = useState<string | null>(null);
  const queryKey = useMemo(() => createQueryKey(query), [query]);

  useEffect(() => {
    if (!query || !queryKey) {
      setData(null);
      setLoading(false);
      setError(null);
      setIndexCreationUrl(null);
      return;
    }

    setLoading(true);
    setIndexCreationUrl(null);

    const unsubscribe = onSnapshot(
      query,
      (snapshot: QuerySnapshot<T>) => {
        const resultData = snapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
          path: doc.ref.path,
        } as T & { id: string; path: string; }));
        
        setData(resultData);
        setLoading(false);
        setError(null);
      },
      (err: FirestoreError) => {
        console.error('Error fetching collection:', err.message);

        if (
          err.code === 'failed-precondition' &&
          err.message.includes('requires an index')
        ) {
          const urlMatch = err.message.match(
            /https?:\/\/console\.firebase\.google\.com\S+/
          );
          if (urlMatch) {
            setIndexCreationUrl(urlMatch[0]);
          }
        }
        
        setError(err);
        setData(null);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [queryKey]);

  return { data, loading, error, indexCreationUrl };
}
