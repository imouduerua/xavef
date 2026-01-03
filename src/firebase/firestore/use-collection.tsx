
'use client';

import {
  onSnapshot,
  Query,
  QuerySnapshot,
  DocumentData,
  FirestoreError,
} from 'firebase/firestore';
import { useEffect, useState, useMemo } from 'react';

// This function creates a stable, serializable key from a Firestore query object.
// This is the key to preventing infinite loops in useEffect.
const createQueryKey = (query: Query<any> | null): string | null => {
    if (!query) return null;
    try {
        const internalQuery = (query as any)._query;
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
        // Fallback to a less stable but still useful key
        return query.toString();
    }
};


export function useCollection<T = DocumentData>(query: Query<T> | null) {
  const [data, setData] = useState<T[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<FirestoreError | null>(null);
  const [indexCreationUrl, setIndexCreationUrl] = useState<string | null>(null);

  // The key is now stable and will only change if the query's definition changes.
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

        // This logic is for helping developers by providing a direct link to create a missing Firestore index.
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

    // This cleanup function is crucial.
    return () => unsubscribe();
  }, [queryKey]); // The hook now ONLY re-runs when the stable key changes.

  return { data, loading, error, indexCreationUrl };
}
