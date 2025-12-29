
'use client';

import {
  onSnapshot,
  Query,
  QuerySnapshot,
  DocumentData,
  FirestoreError,
} from 'firebase/firestore';
import { useEffect, useState, useMemo } from 'react';
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError } from '../errors';

// Helper to create a stable key from the query
const getQueryKey = (query: Query) => {
  if (!query) return null;
  // Firestore queries have a private _query property that contains the details
  const q = (query as any)._query;
  return JSON.stringify({
    path: q.path.canonical,
    filters: q.filters.map((f: any) => f.toString()),
    orderBy: q.orderBy.map((o: any) => o.toString()),
    limit: q.limit,
    startAfter: q.startAt?.toString(),
    endBefore: q.endAt?.toString(),
  });
};


export function useCollection<T = DocumentData>(query: Query<T> | null) {
  const [data, setData] = useState<T[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<FirestoreError | null>(null);
  const [indexCreationUrl, setIndexCreationUrl] = useState<string | null>(null);

  // Generate a stable key from the query object
  const queryKey = useMemo(() => getQueryKey(query), [query]);

  useEffect(() => {
    if (!queryKey || !query) {
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
        const resultData = snapshot.docs.map((doc) => {
          const docData = doc.data();
          return {
            id: doc.id,
            path: doc.ref.path,
            ...docData,
          } as T;
        });
        setData(resultData);
        setLoading(false);
        setError(null);
        setIndexCreationUrl(null);
      },
      (err: FirestoreError) => {
        console.error('Error fetching collection:', err);

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
        } else if (err.code === 'permission-denied') {
          const queryPath = (query as any)?._query?.path?.canonical;
          if (queryPath) {
            const permissionError = new FirestorePermissionError({
              path: queryPath,
              operation: 'list',
            });
            errorEmitter.emit('permission-error', permissionError);
          }
        }

        setError(err);
        setData(null);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  // The effect now depends on the stable key, not the query object itself.
  }, [queryKey, query]);

  return { data, loading, error, indexCreationUrl };
}
