
'use client';

import {
  onSnapshot,
  Query,
  QuerySnapshot,
  DocumentData,
  FirestoreError,
} from 'firebase/firestore';
import { useEffect, useState, useMemo } from 'react';

export function useCollection<T = DocumentData>(query: Query<T> | null) {
  const [data, setData] = useState<T[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<FirestoreError | null>(null);
  const [indexCreationUrl, setIndexCreationUrl] = useState<string | null>(null);

  // Create a stable key from the query's properties to use as a dependency.
  const queryKey = useMemo(() => {
    if (!query) return null;
    try {
        const internalQuery = (query as any)._query;
        return JSON.stringify({
            path: internalQuery.path.segments.join('/'),
            filters: internalQuery.filters?.map((f: any) => `${f.field.segments.join('.')}${f.op}${JSON.stringify(f.value)}`),
            orderBy: internalQuery.orderBy?.map((o: any) => `${o.field.segments.join('.')}${o.dir}`),
            limit: internalQuery.limit,
        });
    } catch (e) {
        console.error("Could not serialize query:", e);
        return null;
    }
  }, [query]);


  useEffect(() => {
    if (!query || !queryKey) {
      setData(null);
      setLoading(false);
      setError(null);
      setIndexCreationUrl(null);
      return;
    }

    setLoading(true);

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
        setIndexCreationUrl(null);
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
  }, [queryKey, query]); 

  return { data, loading, error, indexCreationUrl };
}
