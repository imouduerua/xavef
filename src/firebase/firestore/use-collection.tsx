
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

export function useCollection<T = DocumentData>(query: Query<T> | null) {
  const [data, setData] = useState<T[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<FirestoreError | null>(null);
  const [indexCreationUrl, setIndexCreationUrl] = useState<string | null>(null);

  const dataRef = useRef<string | null>(null);

  // We stringify the query path and constraints to create a stable key for the useEffect dependency array.
  // This is more reliable than depending on the query object itself.
  const queryKey = useMemo(() => {
    if (!query) return null;
    try {
      const q = query as any;
      const path = q._query.path.canonical;
      const constraints = (q._query.constraints || []).map((c: any) => `${c._field.canonical}${c._op}${c._value}`).join(',');
      return `${path}|${constraints}`;
    } catch {
      // Fallback for safety, though it might not be perfectly stable
      return JSON.stringify(query);
    }
  }, [query]);

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

        // Deep compare the new data with the existing data to prevent unnecessary re-renders.
        const resultDataString = JSON.stringify(resultData);
        if (dataRef.current !== resultDataString) {
          dataRef.current = resultDataString;
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
          let queryPathStr = 'unknown path';
           try {
             queryPathStr = (query as any)._query.path.canonical;
           } catch {}
          
          const permissionError = new FirestorePermissionError({
              path: queryPathStr,
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
  }, [queryKey, query]);

  return { data, loading, error, indexCreationUrl };
}
