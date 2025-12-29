
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

export function useCollection<T = DocumentData>(query: Query<T> | null) {
  const [data, setData] = useState<T[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<FirestoreError | null>(null);
  const [indexCreationUrl, setIndexCreationUrl] = useState<string | null>(null);

  // Create a stable key from the query object to use as a dependency.
  // This prevents re-renders if the query object is re-created but logically the same.
  const queryKey = useMemo(() => {
    if (!query) return null;
    // Accessing internal but stable properties of the query object.
    const internalQuery = (query as any)._query;
    if (!internalQuery) return null;
    
    const path = internalQuery.path?.canonical ?? '';
    const filters = internalQuery.filters?.map((f: any) => `${f.field.canonical}${f.op}${f.value}`).join(',') ?? '';
    const orderBy = internalQuery.explicitOrderBy?.map((o: any) => `${o.field.canonical}${o.dir}`).join(',') ?? '';
    const limit = internalQuery.limit ?? '';
    
    return `${path}|${filters}|${orderBy}|${limit}`;
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryKey]); // Depend on the stable query key.

  return { data, loading, error, indexCreationUrl };
}
