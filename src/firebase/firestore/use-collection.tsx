
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

// This function attempts to create a stable key from a Firestore query object.
// It accesses internal properties, which is not ideal but necessary for dependency arrays.
const getQueryKey = (q: Query | null): string => {
    if (!q) return 'null';
    try {
        // Access internal properties to build a stable key.
        // This is fragile and may break with Firebase SDK updates.
        const internalQuery = (q as any)._query;
        const path = internalQuery.path.canonical;
        const filters = internalQuery.filters.map((f: any) => `${f.field.canonical}${f.op}${JSON.stringify(f.value)}`).join(',');
        const orders = internalQuery.explicitOrderBy.map((o: any) => `${o.field.canonical}${o.dir}`).join(',');
        return `${path}|${filters}|${orders}`;
    } catch {
        // Fallback for safety, though it may cause re-renders if the query object changes identity.
        return JSON.stringify(q);
    }
};


export function useCollection<T = DocumentData>(query: Query<T> | null) {
  const [data, setData] = useState<T[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<FirestoreError | null>(null);
  const [indexCreationUrl, setIndexCreationUrl] = useState<string | null>(null);

  const queryKey = useMemo(() => getQueryKey(query), [query]);

  useEffect(() => {
    if (!query) {
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
          let queryPath = 'unknown path';
           try {
             queryPath = (query as any)._query.path.canonical;
           } catch {}
          
          const permissionError = new FirestorePermissionError({
              path: queryPath,
              operation: 'list',
          });
          errorEmitter.emit('permission-error', permissionError);
        }

        setError(err);
        setData(null);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [queryKey]); // Depend on the stable key

  return { data, loading, error, indexCreationUrl };
}
