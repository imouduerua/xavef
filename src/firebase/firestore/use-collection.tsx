
'use client';

import {
  onSnapshot,
  Query,
  QuerySnapshot,
  DocumentData,
  FirestoreError,
} from 'firebase/firestore';
import { useEffect, useState, useMemo, useRef } from 'react';
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError } from '../errors';

// This function attempts to create a stable key from a Firestore query object.
const getQueryKey = (q: Query | null): string => {
    if (!q) return 'null';
    try {
        const internalQuery = (q as any)._query;
        if (!internalQuery) return JSON.stringify(q); // Fallback for safety
        const path = internalQuery.path.canonical;
        const filters = internalQuery.filters.map((f: any) => `${f.field.canonical}${f.op}${JSON.stringify(f.value)}`).join(',');
        const orders = internalQuery.explicitOrderBy.map((o: any) => `${o.field.canonical}${o.dir}`).join(',');
        return `${path}|${filters}|${orders}`;
    } catch {
        return JSON.stringify(q); // Fallback for safety
    }
};

export function useCollection<T = DocumentData>(query: Query<T> | null) {
  const [data, setData] = useState<T[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<FirestoreError | null>(null);
  const [indexCreationUrl, setIndexCreationUrl] = useState<string | null>(null);

  const queryKey = useMemo(() => getQueryKey(query), [query]);
  const dataRef = useRef(data);
  dataRef.current = data;

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

        // This is the critical fix: Only update state if the data has actually changed.
        // This prevents infinite loops caused by new array references on every snapshot.
        if (JSON.stringify(dataRef.current) !== JSON.stringify(resultData)) {
            setData(resultData);
        }

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
  }, [queryKey]);

  return { data, loading, error, indexCreationUrl };
}
